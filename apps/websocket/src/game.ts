import {
  games as dbGames,
  gameMembers,
  questions as dbQuestions,
  questionAnswers,
  ratings,
  db,
  eq,
  desc,
} from "@repo/database";
import {
  calculateElo,
  type InternalQuestion,
  type PublicQuestion,
  type MathOperator,
  type PlayerRatingSummary,
  type ServerEvent,
} from "@repo/common";
import type { ConnectedUser, ActiveGame } from "./types";
import { activeGames, pendingInvitations, waitingQueue } from "./state";
import { sendEvent } from "./events";

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

export async function startMatch(
  player1: ConnectedUser,
  player2: ConnectedUser,
  timeLimit = 60
): Promise<ActiveGame> {
  let questions = generateQuestionBatch(60);
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

      try {
        const insertedQuestions = await db
          .insert(dbQuestions)
          .values(
            questions.map((q) => ({
              gameId,
              operand1: q.operand1,
              operand2: q.operand2,
              operator: q.operator,
              correctAnswer: q.correctAnswer,
              orderIndex: q.orderIndex,
            }))
          )
          .returning({
            id: dbQuestions.id,
            orderIndex: dbQuestions.orderIndex,
            operand1: dbQuestions.operand1,
            operand2: dbQuestions.operand2,
            operator: dbQuestions.operator,
            correctAnswer: dbQuestions.correctAnswer,
          });

        if (insertedQuestions && insertedQuestions.length > 0) {
          questions = insertedQuestions.map((q) => ({
            id: q.id,
            orderIndex: q.orderIndex,
            operand1: q.operand1,
            operand2: q.operand2,
            operator: q.operator,
            correctAnswer: q.correctAnswer,
          }));
        }
      } catch (qErr) {
        console.warn(
          `[WebSocket] Failed to insert questions into db for game #${gameId}:`,
          qErr
        );
      }
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
      try {
        const existingQRows = await db
          .select({ id: dbQuestions.id })
          .from(dbQuestions)
          .where(eq(dbQuestions.gameId, gameId));
        const existingQIds = new Set(existingQRows.map((r) => r.id));

        const missingQuestions = game.questions.filter((q) => !existingQIds.has(q.id));
        if (missingQuestions.length > 0) {
          const reinserted = await db
            .insert(dbQuestions)
            .values(
              missingQuestions.map((q) => ({
                gameId,
                operand1: q.operand1,
                operand2: q.operand2,
                operator: q.operator,
                correctAnswer: q.correctAnswer,
                orderIndex: q.orderIndex,
              }))
            )
            .returning({ id: dbQuestions.id, orderIndex: dbQuestions.orderIndex });

          const orderToNewId = new Map(reinserted.map((r) => [r.orderIndex, r.id]));
          for (const ans of realAnswers) {
            if (!existingQIds.has(ans.questionId)) {
              const q = game.questions.find((gq) => gq.id === ans.questionId);
              if (q && orderToNewId.has(q.orderIndex)) {
                ans.questionId = orderToNewId.get(q.orderIndex)!;
              }
            }
          }
        }

        const validQRows = await db
          .select({ id: dbQuestions.id })
          .from(dbQuestions)
          .where(eq(dbQuestions.gameId, gameId));
        const validQIds = new Set(validQRows.map((r) => r.id));
        const validAnswers = realAnswers.filter((ans) => validQIds.has(ans.questionId));

        if (validAnswers.length > 0) {
          await db.insert(questionAnswers).values(
            validAnswers.map((ans) => ({
              gameId,
              questionId: ans.questionId,
              userId: ans.userId,
              submittedAnswer: ans.submittedAnswer,
              isCorrect: ans.isCorrect,
              timeTakenMs: ans.timeTakenMs,
            }))
          );
        }
      } catch (qaErr) {
        console.warn(
          `[WebSocket] Warning inserting question_answers for game #${gameId}:`,
          qaErr
        );
      }
    }
  } catch (err) {
    console.warn(`[WebSocket] Error persisting finished game #${gameId}:`, err);
  }
}
