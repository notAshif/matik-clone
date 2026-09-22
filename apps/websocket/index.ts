import { WebSocketServer, WebSocket } from "ws";
import {
  users,
  games as dbGames,
  gameMembers,
  questionAnswers,
  ratings,
  db,
  eq,
  desc,
} from "@repo/database";
import { verify, type JwtPayload } from "jsonwebtoken";
import {
  clientActionSchema,
  calculateElo,
  type ClientAction,
  type ServerEvent,
  type SafeUser,
  type PublicQuestion,
  type InternalQuestion,
  type MathOperator,
  type PlayerRatingSummary,
} from "@repo/common";


export type ConnectedUser = {
  id: number;
  username: string;
  email?: string;
  ws: WebSocket;
};

export type PlayerAnswerRecord = {
  gameId: number;
  questionId: number;
  userId: number;
  submittedAnswer: number;
  isCorrect: boolean;
  timeTakenMs: number;
};

export type ActiveGame = {
  id: number;
  players: [ConnectedUser, ConnectedUser];
  scores: Record<number, number>; // userId -> score
  userQuestionIndex: Record<number, number>; // userId -> index in questions array
  questions: InternalQuestion[];
  answeredRecords: PlayerAnswerRecord[];
  startTime: Date;
  timeLimit: number;
  timer: ReturnType<typeof setTimeout>;
  isSettled: boolean;
};

export type PendingInvitation = {
  id: string;
  fromUser: ConnectedUser;
  toUser: ConnectedUser;
  timeout: ReturnType<typeof setTimeout>;
};

const PORT = Number(process.env.PORT) || 4000;
const JWT_SECRET =
  process.env.JWT_SECRET ||
  (typeof import.meta !== "undefined" && import.meta.env?.JWT_SECRET) ||
  "fdsjhkhjshsgfhgfjshgfjhdfg";

const wss = new WebSocketServer({ port: PORT });
console.log(`[WebSocket] Server listening on port ${PORT}`);

const connectedUsers = new Map<number, ConnectedUser>(); // Key: userId
const waitingQueue: ConnectedUser[] = [];
const pendingInvitations = new Map<string, PendingInvitation>(); // Key: invitationId
const activeGames = new Map<number, ActiveGame>(); // Key: gameId

export function sendEvent(ws: WebSocket, event: ServerEvent): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(event));
  }
}

export function broadcastOnlineUsers(): void {
  const safeList: SafeUser[] = Array.from(connectedUsers.values()).map((u) => ({
    id: u.id,
    username: u.username,
    email: u.email,
  }));

  const event: ServerEvent = {
    type: "ONLINE_USERS",
    payload: { users: safeList },
  };

  const payload = JSON.stringify(event);
  for (const client of connectedUsers.values()) {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(payload);
    }
  }
}

export function generateQuestion(orderIndex: number): InternalQuestion {
  const operators: MathOperator[] = ["+", "-", "*", "/"];
  const operator = operators[Math.floor(Math.random() * operators.length)]!;
  let operand1 = 0;
  let operand2 = 0;
  let correctAnswer = 0;

  switch (operator) {
    case "+": {
      operand1 = Math.floor(Math.random() * 50) + 1;
      operand2 = Math.floor(Math.random() * 50) + 1;
      correctAnswer = operand1 + operand2;
      break;
    }
    case "-": {
      operand1 = Math.floor(Math.random() * 60) + 10;
      operand2 = Math.floor(Math.random() * operand1) + 1;
      correctAnswer = operand1 - operand2;
      break;
    }
    case "*": {
      operand1 = Math.floor(Math.random() * 12) + 2;
      operand2 = Math.floor(Math.random() * 12) + 2;
      correctAnswer = operand1 * operand2;
      break;
    }
    case "/": {
      const quotient = Math.floor(Math.random() * 12) + 1;
      operand2 = Math.floor(Math.random() * 10) + 2;
      operand1 = quotient * operand2;
      correctAnswer = quotient;
      break;
    }
  }

  return {
    id: orderIndex + 1,
    orderIndex,
    operand1,
    operand2,
    operator,
    correctAnswer,
  };
}

export function toPublicQuestion(q: InternalQuestion): PublicQuestion {
  return {
    id: q.id,
    orderIndex: q.orderIndex,
    operand1: q.operand1,
    operand2: q.operand2,
    operator: q.operator,
  };
}

export function generateQuestionBatch(count: number): InternalQuestion[] {
  const list: InternalQuestion[] = [];
  for (let i = 0; i < count; i++) {
    list.push(generateQuestion(i));
  }
  return list;
}

export async function startMatch(
  player1: ConnectedUser,
  player2: ConnectedUser,
  timeLimit = 60
): Promise<ActiveGame> {
  const questions = generateQuestionBatch(60);
  const now = new Date();

  let gameId = Math.floor(Math.random() * 1000000) + 1;
  try {
    const [inserted] = await db
      .insert(dbGames)
      .values({
        status: "in_progress",
        timeLimit,
        startTime: now,
      })
      .returning({ id: dbGames.id });
    if (inserted?.id) {
      gameId = inserted.id;
    }
  } catch (err) {
    console.warn(
      `[WebSocket] Database insert failed for new game, using fallback ID ${gameId}:`,
      err
    );
  }

  const activeGame: ActiveGame = {
    id: gameId,
    players: [player1, player2],
    scores: {
      [player1.id]: 0,
      [player2.id]: 0,
    },
    userQuestionIndex: {
      [player1.id]: 0,
      [player2.id]: 0,
    },
    questions,
    answeredRecords: [],
    startTime: now,
    timeLimit,
    isSettled: false,
    timer: setTimeout(() => {
      finishGame(gameId, "TIME_UP");
    }, timeLimit * 1000),
  };

  activeGames.set(gameId, activeGame);

  // Clear any existing invitations involving either player
  for (const [inviteId, invite] of pendingInvitations.entries()) {
    if (
      invite.fromUser.id === player1.id ||
      invite.toUser.id === player1.id ||
      invite.fromUser.id === player2.id ||
      invite.toUser.id === player2.id
    ) {
      clearTimeout(invite.timeout);
      pendingInvitations.delete(inviteId);
    }
  }

  // Remove both players from queue if waiting
  const p1QueueIdx = waitingQueue.findIndex((u) => u.id === player1.id);
  if (p1QueueIdx !== -1) waitingQueue.splice(p1QueueIdx, 1);
  const p2QueueIdx = waitingQueue.findIndex((u) => u.id === player2.id);
  if (p2QueueIdx !== -1) waitingQueue.splice(p2QueueIdx, 1);

  const [p1Rating, p2Rating] = await Promise.all([
    getLatestRating(player1.id),
    getLatestRating(player2.id),
  ]);

  sendEvent(player1.ws, {
    type: "START_GAME",
    payload: {
      gameId,
      timeLimit,
      opponent: { id: player2.id, username: player2.username, email: player2.email, rating: p2Rating },
      firstQuestion: toPublicQuestion(questions[0]!),
    },
  });

  sendEvent(player2.ws, {
    type: "START_GAME",
    payload: {
      gameId,
      timeLimit,
      opponent: { id: player1.id, username: player1.username, email: player1.email, rating: p1Rating },
      firstQuestion: toPublicQuestion(questions[0]!),
    },
  });

  return activeGame;
}

export async function getLatestRating(userId: number): Promise<number> {
  try {
    const latest = await db
      .select({ ratingAfter: ratings.ratingAfter })
      .from(ratings)
      .where(eq(ratings.userId, userId))
      .orderBy(desc(ratings.createdAt))
      .limit(1);

    if (latest.length > 0 && typeof latest[0]?.ratingAfter === "number") {
      return Math.round(latest[0].ratingAfter);
    }
  } catch (err) {
    console.warn(`[WebSocket] Error fetching rating for user #${userId}:`, err);
  }
  return 1200;
}

export async function finishGame(
  gameId: number,
  reason: "TIME_UP" | "PLAYER_FORFEIT",
  forfeitedUserId?: number
): Promise<void> {
  const game = activeGames.get(gameId);
  if (!game || game.isSettled) return;

  game.isSettled = true;
  clearTimeout(game.timer);

  const [p1, p2] = game.players;
  let winnerId: number | null = null;

  if (reason === "PLAYER_FORFEIT" && forfeitedUserId !== undefined) {
    winnerId = p1.id === forfeitedUserId ? p2.id : p1.id;
  } else {
    const s1 = game.scores[p1.id] ?? 0;
    const s2 = game.scores[p2.id] ?? 0;
    if (s1 > s2) winnerId = p1.id;
    else if (s2 > s1) winnerId = p2.id;
    else winnerId = null; // Draw
  }

  // Calculate Elo rating changes
  let p1Before = 1200;
  let p2Before = 1200;
  let p1NewRating = 1200;
  let p2NewRating = 1200;
  let p1Delta = 0;
  let p2Delta = 0;

  try {
    p1Before = await getLatestRating(p1.id);
    p2Before = await getLatestRating(p2.id);

    const score1 = winnerId === p1.id ? 1 : winnerId === p2.id ? 0 : 0.5;
    const score2 = winnerId === p2.id ? 1 : winnerId === p1.id ? 0 : 0.5;

    const elo1 = calculateElo(p1Before, p2Before, score1);
    const elo2 = calculateElo(p2Before, p1Before, score2);

    p1NewRating = elo1.newRatingA;
    p1Delta = elo1.deltaA;
    p2NewRating = elo2.newRatingA;
    p2Delta = elo2.deltaA;
  } catch (err) {
    console.warn(`[WebSocket] Error computing Elo for game #${gameId}:`, err);
  }

  const ratingPayload: Record<number, PlayerRatingSummary> = {
    [p1.id]: {
      ratingBefore: p1Before,
      ratingAfter: p1NewRating,
      ratingChange: p1Delta,
    },
    [p2.id]: {
      ratingBefore: p2Before,
      ratingAfter: p2NewRating,
      ratingChange: p2Delta,
    },
  };

  const gameOverEvent: ServerEvent = {
    type: "GAME_OVER",
    payload: {
      gameId,
      winnerId,
      scores: game.scores,
      reason,
      ratings: ratingPayload,
    },
  };

  sendEvent(p1.ws, gameOverEvent);
  sendEvent(p2.ws, gameOverEvent);

  activeGames.delete(gameId);

  try {
    const endTime = new Date();
    await db
      .update(dbGames)
      .set({
        status: reason === "PLAYER_FORFEIT" ? "abandoned" : "completed",
        endTime,
      })
      .where(eq(dbGames.id, gameId));

    const realPlayers = game.players.filter((p) => p.id > 0);

    for (const player of realPlayers) {
      const pScore = game.scores[player.id] ?? 0;
      await db.insert(gameMembers).values({
        gameId,
        userId: player.id,
        score: pScore,
        isWinner: winnerId === player.id,
        rank: winnerId === player.id ? 1 : winnerId === null ? 1 : 2,
      });

      const pBefore = player.id === p1.id ? p1Before : p2Before;
      const pAfter = player.id === p1.id ? p1NewRating : p2NewRating;
      const pDelta = player.id === p1.id ? p1Delta : p2Delta;

      await db.insert(ratings).values({
        gameId,
        userId: player.id,
        ratingBefore: pBefore,
        ratingAfter: pAfter,
        ratingChange: pDelta,
      });
    }

    const realAnswers = game.answeredRecords.filter((ans) => ans.userId > 0);
    if (realAnswers.length > 0) {
      await db.insert(questionAnswers).values(
        realAnswers.map((ans) => ({
          gameId,
          questionId: ans.questionId,
          userId: ans.userId,
          submittedAnswer: ans.submittedAnswer,
          isCorrect: ans.isCorrect,
          timeTakenMs: ans.timeTakenMs,
        }))
      );
    }
  } catch (err) {
    console.warn(`[WebSocket] Error persisting finished game #${gameId}:`, err);
  }
}

export function cleanupUser(userId: number): void {
  const qIdx = waitingQueue.findIndex((u) => u.id === userId);
  if (qIdx !== -1) {
    waitingQueue.splice(qIdx, 1);
  }

  for (const [inviteId, invite] of pendingInvitations.entries()) {
    if (invite.fromUser.id === userId || invite.toUser.id === userId) {
      clearTimeout(invite.timeout);
      if (invite.fromUser.id === userId) {
        sendEvent(invite.toUser.ws, {
          type: "INVITATION",
          payload: {
            invitationId: inviteId,
            status: "DECLINED",
            sender: { id: userId, username: invite.fromUser.username },
            recipient: { id: invite.toUser.id, username: invite.toUser.username },
            role: "RECIPIENT",
            reason: "Challenger disconnected",
          },
        });
      } else {
        sendEvent(invite.fromUser.ws, {
          type: "INVITATION",
          payload: {
            invitationId: inviteId,
            status: "DECLINED",
            sender: { id: invite.fromUser.id, username: invite.fromUser.username },
            recipient: { id: invite.toUser.id, username: invite.toUser.username },
            role: "CHALLENGER",
            reason: "Opponent disconnected",
          },
        });
      }
      pendingInvitations.delete(inviteId);
    }
  }

  for (const [gameId, game] of activeGames.entries()) {
    if (game.players.some((p) => p.id === userId)) {
      finishGame(gameId, "PLAYER_FORFEIT", userId);
    }
  }

  connectedUsers.delete(userId);
  broadcastOnlineUsers();
}

wss.on("connection", (ws: WebSocket, req) => {
  const earlyMessageQueue: (string | Buffer)[] = [];
  let isReady = false;
  let handleAction: ((action: ClientAction) => Promise<void>) | null = null;

  // 1. Immediately attach synchronous listener to prevent early packet dropping
  ws.on("message", (data) => {
    if (!isReady || !handleAction) {
      earlyMessageQueue.push(data as string | Buffer);
      return;
    }
    processMessage(data);
  });

  const processMessage = async (data: string | Buffer | ArrayBuffer | Buffer[]) => {
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(data.toString());
    } catch {
      return;
    }

    const validation = clientActionSchema.safeParse(parsedJson);
    if (!validation.success) {
      console.warn(`[WebSocket] Invalid message:`, validation.error.message);
      return;
    }

    if (handleAction) {
      await handleAction(validation.data);
    }
  };

  (async () => {
    const token = req.url?.split("token=")[1]?.split("&")[0];

    if (!token) {
      ws.close(1008, "Token missing");
      return;
    }

    let decode: JwtPayload;
    try {
      decode = verify(token, JWT_SECRET) as JwtPayload;
    } catch {
      ws.close(1008, "Invalid token");
      return;
    }

    const userId = Number(decode.userId ?? decode.id);
    if (!userId || isNaN(userId)) {
      ws.close(1008, "Invalid user ID in token");
      return;
    }

    let username = decode.username as string | undefined;
    let email = decode.email as string | undefined;
    try {
      const dbUser = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });
      if (dbUser) {
        username = dbUser.username;
        email = dbUser.email;
      }
    } catch (err) {
      console.warn(`[WebSocket] Could not query user #${userId} from db:`, err);
    }

    if (!username) {
      username = `Player_${userId}`;
    }

    const existingConn = connectedUsers.get(userId);
    if (existingConn && existingConn.ws !== ws && existingConn.ws.readyState === WebSocket.OPEN) {
      try {
        existingConn.ws.close(1000, "Replaced by newer session");
      } catch {}
    }

    const connectedUser: ConnectedUser = {
      id: userId,
      username,
      email,
      ws,
    };
    connectedUsers.set(userId, connectedUser);
    broadcastOnlineUsers();

    sendEvent(ws, {
      type: "QUEUE_STATUS",
      payload: { status: "IDLE" },
    });

    handleAction = async (action: ClientAction) => {
      switch (action.type) {
        case "JOIN_QUEUE": {
          if (waitingQueue.some((u) => u.id === userId)) {
            return;
          }

          // 1. If an opponent is already in the queue, match immediately!
          if (waitingQueue.length > 0) {
            const opponent = waitingQueue.shift()!;
            if (opponent.id !== userId && opponent.ws.readyState === WebSocket.OPEN) {
              await startMatch(opponent, connectedUser);
              return;
            }
          }

          // 2. If no one is waiting in queue, check for any idle online player in lobby
          const idleCandidate = Array.from(connectedUsers.values()).find((u) => {
            if (u.id === userId) return false;
            if (u.ws.readyState !== WebSocket.OPEN) return false;

            const isInGame = Array.from(activeGames.values()).some(
              (g) => !g.isSettled && g.players.some((p) => p.id === u.id)
            );
            if (isInGame) return false;

            const isInInvite = Array.from(pendingInvitations.values()).some(
              (inv) => inv.fromUser.id === u.id || inv.toUser.id === u.id
            );
            if (isInInvite) return false;

            return true;
          });

          if (idleCandidate) {
            // Automatically send direct duel challenge to the available online user
            const invitationId = crypto.randomUUID();
            const timeout = setTimeout(() => {
              pendingInvitations.delete(invitationId);
              sendEvent(connectedUser.ws, {
                type: "INVITATION",
                payload: {
                  invitationId,
                  status: "EXPIRED",
                  sender: { id: connectedUser.id, username: connectedUser.username },
                  recipient: { id: idleCandidate.id, username: idleCandidate.username },
                  role: "CHALLENGER",
                },
              });
              sendEvent(idleCandidate.ws, {
                type: "INVITATION",
                payload: {
                  invitationId,
                  status: "EXPIRED",
                  sender: { id: connectedUser.id, username: connectedUser.username },
                  recipient: { id: idleCandidate.id, username: idleCandidate.username },
                  role: "RECIPIENT",
                },
              });
            }, 30000);

            pendingInvitations.set(invitationId, {
              id: invitationId,
              fromUser: connectedUser,
              toUser: idleCandidate,
              timeout,
            });

            sendEvent(connectedUser.ws, {
              type: "QUEUE_STATUS",
              payload: { status: "IDLE" },
            });
            sendEvent(connectedUser.ws, {
              type: "INVITATION",
              payload: {
                invitationId,
                status: "PENDING",
                sender: { id: connectedUser.id, username: connectedUser.username },
                recipient: { id: idleCandidate.id, username: idleCandidate.username },
                role: "CHALLENGER",
              },
            });
            sendEvent(idleCandidate.ws, {
              type: "INVITATION",
              payload: {
                invitationId,
                status: "PENDING",
                sender: { id: connectedUser.id, username: connectedUser.username },
                recipient: { id: idleCandidate.id, username: idleCandidate.username },
                role: "RECIPIENT",
              },
            });
            break;
          }

          // 3. Otherwise wait in queue
          waitingQueue.push(connectedUser);
          sendEvent(ws, {
            type: "QUEUE_STATUS",
            payload: { status: "WAITING" },
          });
          break;
        }

        case "LEAVE_QUEUE": {
          const idx = waitingQueue.findIndex((u) => u.id === userId);
          if (idx !== -1) {
            waitingQueue.splice(idx, 1);
          }
          sendEvent(ws, {
            type: "QUEUE_STATUS",
            payload: { status: "IDLE" },
          });
          break;
        }

        case "INVITE_PLAYER": {
          const targetUserId = action.payload.targetUserId;
          if (targetUserId === connectedUser.id || targetUserId <= 0) {
            return;
          }

          const targetUser = connectedUsers.get(targetUserId);
          if (!targetUser || targetUser.ws.readyState !== WebSocket.OPEN) {
            sendEvent(ws, {
              type: "INVITATION",
              payload: {
                invitationId: "",
                status: "DECLINED",
                sender: { id: connectedUser.id, username: connectedUser.username },
                recipient: { id: targetUserId, username: "Player (Offline)" },
                role: "CHALLENGER",
                reason: "Player is offline",
              },
            });
            return;
          }

          // Check if target user is currently in a battle
          const isTargetInGame = Array.from(activeGames.values()).some(
            (g) => !g.isSettled && g.players.some((p) => p.id === targetUserId)
          );
          if (isTargetInGame) {
            sendEvent(ws, {
              type: "INVITATION",
              payload: {
                invitationId: "",
                status: "DECLINED",
                sender: { id: connectedUser.id, username: connectedUser.username },
                recipient: { id: targetUserId, username: targetUser.username },
                role: "CHALLENGER",
                reason: `${targetUser.username} is currently in battle`,
              },
            });
            return;
          }

          // Mutual Challenge: check if targetUser has already invited connectedUser
          for (const [existingInviteId, existingInvite] of pendingInvitations.entries()) {
            if (
              existingInvite.fromUser.id === targetUserId &&
              existingInvite.toUser.id === connectedUser.id
            ) {
              clearTimeout(existingInvite.timeout);
              pendingInvitations.delete(existingInviteId);
              if (
                existingInvite.fromUser.ws.readyState === WebSocket.OPEN &&
                connectedUser.ws.readyState === WebSocket.OPEN
              ) {
                await startMatch(existingInvite.fromUser, connectedUser);
              }
              return;
            }
          }

          // Check if connectedUser already has an outgoing invite to targetUser
          for (const [existingInviteId, existingInvite] of pendingInvitations.entries()) {
            if (
              existingInvite.fromUser.id === connectedUser.id &&
              existingInvite.toUser.id === targetUserId
            ) {
              sendEvent(connectedUser.ws, {
                type: "INVITATION",
                payload: {
                  invitationId: existingInviteId,
                  status: "PENDING",
                  sender: { id: connectedUser.id, username: connectedUser.username },
                  recipient: { id: targetUser.id, username: targetUser.username },
                  role: "CHALLENGER",
                },
              });
              return;
            }
          }

          const invitationId = crypto.randomUUID();
          const timeout = setTimeout(() => {
            pendingInvitations.delete(invitationId);
            sendEvent(connectedUser.ws, {
              type: "INVITATION",
              payload: {
                invitationId,
                status: "EXPIRED",
                sender: { id: connectedUser.id, username: connectedUser.username },
                recipient: { id: targetUser.id, username: targetUser.username },
                role: "CHALLENGER",
              },
            });
            sendEvent(targetUser.ws, {
              type: "INVITATION",
              payload: {
                invitationId,
                status: "EXPIRED",
                sender: { id: connectedUser.id, username: connectedUser.username },
                recipient: { id: targetUser.id, username: targetUser.username },
                role: "RECIPIENT",
              },
            });
          }, 30000);

          pendingInvitations.set(invitationId, {
            id: invitationId,
            fromUser: connectedUser,
            toUser: targetUser,
            timeout,
          });

          sendEvent(connectedUser.ws, {
            type: "INVITATION",
            payload: {
              invitationId,
              status: "PENDING",
              sender: { id: connectedUser.id, username: connectedUser.username },
              recipient: { id: targetUser.id, username: targetUser.username },
              role: "CHALLENGER",
            },
          });
          sendEvent(targetUser.ws, {
            type: "INVITATION",
            payload: {
              invitationId,
              status: "PENDING",
              sender: { id: connectedUser.id, username: connectedUser.username },
              recipient: { id: targetUser.id, username: targetUser.username },
              role: "RECIPIENT",
            },
          });
          break;
        }

        case "CANCEL_INVITATION": {
          for (const [inviteId, invite] of pendingInvitations.entries()) {
            if (invite.fromUser.id === connectedUser.id) {
              clearTimeout(invite.timeout);
              pendingInvitations.delete(inviteId);
              sendEvent(invite.toUser.ws, {
                type: "INVITATION",
                payload: {
                  invitationId: inviteId,
                  status: "CANCELLED",
                  sender: { id: connectedUser.id, username: connectedUser.username },
                  recipient: { id: invite.toUser.id, username: invite.toUser.username },
                  role: "RECIPIENT",
                },
              });
              sendEvent(connectedUser.ws, {
                type: "INVITATION",
                payload: {
                  invitationId: inviteId,
                  status: "CANCELLED",
                  sender: { id: connectedUser.id, username: connectedUser.username },
                  recipient: { id: invite.toUser.id, username: invite.toUser.username },
                  role: "CHALLENGER",
                },
              });
            }
          }
          break;
        }

        case "ACCEPT_GAME": {
          const invite = pendingInvitations.get(action.payload.invitationId);
          if (!invite) return;

          clearTimeout(invite.timeout);
          pendingInvitations.delete(action.payload.invitationId);

          if (
            invite.fromUser.ws.readyState === WebSocket.OPEN &&
            connectedUser.ws.readyState === WebSocket.OPEN
          ) {
            await startMatch(invite.fromUser, connectedUser);
          }
          break;
        }

        case "DECLINE_GAME": {
          const invite = pendingInvitations.get(action.payload.invitationId);
          if (!invite) return;

          clearTimeout(invite.timeout);
          pendingInvitations.delete(action.payload.invitationId);

          sendEvent(invite.fromUser.ws, {
            type: "INVITATION",
            payload: {
              invitationId: action.payload.invitationId,
              status: "DECLINED",
              sender: { id: invite.fromUser.id, username: invite.fromUser.username },
              recipient: { id: connectedUser.id, username: connectedUser.username },
              role: "CHALLENGER",
              reason: `${connectedUser.username} declined the challenge`,
            },
          });
          sendEvent(connectedUser.ws, {
            type: "INVITATION",
            payload: {
              invitationId: action.payload.invitationId,
              status: "DECLINED",
              sender: { id: invite.fromUser.id, username: invite.fromUser.username },
              recipient: { id: connectedUser.id, username: connectedUser.username },
              role: "RECIPIENT",
            },
          });
          break;
        }

        case "SUBMIT_ANSWER": {
          const { gameId, questionId, answer, timeTakenMs } = action.payload;
          const game = activeGames.get(gameId);
          if (!game || game.isSettled) return;

          const currentIdx = game.userQuestionIndex[userId] ?? 0;
          const currentQuestion = game.questions[currentIdx];
          if (!currentQuestion || currentQuestion.id !== questionId) return;

          const isCorrect = answer === currentQuestion.correctAnswer;
          if (isCorrect) {
            game.scores[userId] = (game.scores[userId] ?? 0) + 10;
          }

          game.answeredRecords.push({
            gameId,
            questionId,
            userId,
            submittedAnswer: answer,
            isCorrect,
            timeTakenMs,
          });

          let nextQuestion: InternalQuestion;

          if (isCorrect) {
            const nextIdx = currentIdx + 1;
            game.userQuestionIndex[userId] = nextIdx;

            if (nextIdx >= game.questions.length) {
              game.questions.push(generateQuestion(game.questions.length));
            }
            nextQuestion = game.questions[nextIdx]!;
          } else {
            // If answer is incorrect, stay at the same question for retry
            nextQuestion = currentQuestion;
          }

          sendEvent(ws, {
            type: "ANSWER_RESULT",
            payload: {
              questionId,
              isCorrect,
              correctAnswer: currentQuestion.correctAnswer,
              myScore: game.scores[userId] ?? 0,
              nextQuestion: toPublicQuestion(nextQuestion),
            },
          });

          const scoreUpdateEvent: ServerEvent = {
            type: "SCORE_UPDATE",
            payload: {
              scores: game.scores,
            },
          };

          const [p1, p2] = game.players;
          sendEvent(p1.ws, scoreUpdateEvent);
          if (p2.id > 0) {
            sendEvent(p2.ws, scoreUpdateEvent);
          }
          break;
        }
      }
    };

    ws.on("close", () => {
      if (connectedUsers.get(userId)?.ws === ws) {
        cleanupUser(userId);
      }
    });

    ws.on("error", (err) => {
      console.error(`[WebSocket] Error on client #${userId}:`, err);
      if (connectedUsers.get(userId)?.ws === ws) {
        cleanupUser(userId);
      }
    });

    // 2. Mark ready and flush any buffered early actions
    isReady = true;
    while (earlyMessageQueue.length > 0) {
      const earlyMsg = earlyMessageQueue.shift()!;
      await processMessage(earlyMsg);
    }
  })().catch((err) => {
    console.error("[WebSocket] Unhandled error in connection initialization:", err);
    ws.close(1011, "Internal server error");
  });
});