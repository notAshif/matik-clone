import { WebSocket } from "ws";
import type { ClientAction, InternalQuestion, ServerEvent } from "@repo/common";
import type { ConnectedUser } from "./types";
import { connectedUsers, waitingQueue, pendingInvitations, activeGames } from "./state";
import { sendEvent, toSafeUser, broadcastOnlineUsers } from "./events";
import { startMatch, finishGame, generateQuestion, toPublicQuestion } from "./game";

export async function handleAction(connectedUser: ConnectedUser, action: ClientAction): Promise<void> {
  const userId = connectedUser.id;
  const ws = connectedUser.ws;

  switch (action.type) {
    case "JOIN_QUEUE": {
      // 1. If an opponent is already waiting in queue, match immediately!
      const opponentIdx = waitingQueue.findIndex(
        (u) => u.id !== userId && u.ws.readyState === WebSocket.OPEN
      );
      if (opponentIdx !== -1) {
        const opponent = waitingQueue.splice(opponentIdx, 1)[0]!;
        await startMatch(opponent, connectedUser);
        return;
      }

      // 2. Add connected user to queue if not already there
      if (!waitingQueue.some((u) => u.id === userId)) {
        waitingQueue.push(connectedUser);
      }

      // Always acknowledge that the user is actively searching in queue
      sendEvent(ws, {
        type: "QUEUE_STATUS",
        payload: { status: "WAITING" },
      });

      // 3. Proactively check for any idle online player in the lobby to challenge
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
        // Dispatch duel challenge to the available online user
        const invitationId = crypto.randomUUID();
        const timeout = setTimeout(() => {
          pendingInvitations.delete(invitationId);
          sendEvent(connectedUser.ws, {
            type: "INVITATION",
            payload: {
              invitationId,
              status: "EXPIRED",
              sender: toSafeUser(connectedUser),
              recipient: toSafeUser(idleCandidate),
              role: "CHALLENGER",
            },
          });
          sendEvent(idleCandidate.ws, {
            type: "INVITATION",
            payload: {
              invitationId,
              status: "EXPIRED",
              sender: toSafeUser(connectedUser),
              recipient: toSafeUser(idleCandidate),
              role: "RECIPIENT",
            },
          });

          // Ensure challenger stays in queue searching if still connected
          if (connectedUser.ws.readyState === WebSocket.OPEN) {
            if (!waitingQueue.some((u) => u.id === userId)) {
              waitingQueue.push(connectedUser);
            }
            sendEvent(connectedUser.ws, {
              type: "QUEUE_STATUS",
              payload: { status: "WAITING" },
            });
          }
        }, 30000);

        pendingInvitations.set(invitationId, {
          id: invitationId,
          fromUser: connectedUser,
          toUser: idleCandidate,
          timeout,
        });

        // Notify both challenger and recipient with PENDING invitation
        sendEvent(connectedUser.ws, {
          type: "INVITATION",
          payload: {
            invitationId,
            status: "PENDING",
            sender: toSafeUser(connectedUser),
            recipient: toSafeUser(idleCandidate),
            role: "CHALLENGER",
          },
        });
        sendEvent(idleCandidate.ws, {
          type: "INVITATION",
          payload: {
            invitationId,
            status: "PENDING",
            sender: toSafeUser(connectedUser),
            recipient: toSafeUser(idleCandidate),
            role: "RECIPIENT",
          },
        });
      }
      break;
    }

    case "LEAVE_QUEUE": {
      const idx = waitingQueue.findIndex((u) => u.id === userId);
      if (idx !== -1) {
        waitingQueue.splice(idx, 1);
      }

      // Also cancel any pending invitations dispatched by this user
      for (const [inviteId, invite] of pendingInvitations.entries()) {
        if (invite.fromUser.id === userId) {
          clearTimeout(invite.timeout);
          pendingInvitations.delete(inviteId);
          sendEvent(invite.toUser.ws, {
            type: "INVITATION",
            payload: {
              invitationId: inviteId,
              status: "CANCELLED",
              sender: toSafeUser(connectedUser),
              recipient: toSafeUser(invite.toUser),
              role: "RECIPIENT",
            },
          });
          sendEvent(connectedUser.ws, {
            type: "INVITATION",
            payload: {
              invitationId: inviteId,
              status: "CANCELLED",
              sender: toSafeUser(connectedUser),
              recipient: toSafeUser(invite.toUser),
              role: "CHALLENGER",
            },
          });
        }
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
            sender: toSafeUser(connectedUser),
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
            sender: toSafeUser(connectedUser),
            recipient: toSafeUser(targetUser),
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
              sender: toSafeUser(connectedUser),
              recipient: toSafeUser(targetUser),
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
            sender: toSafeUser(connectedUser),
            recipient: toSafeUser(targetUser),
            role: "CHALLENGER",
          },
        });
        sendEvent(targetUser.ws, {
          type: "INVITATION",
          payload: {
            invitationId,
            status: "EXPIRED",
            sender: toSafeUser(connectedUser),
            recipient: toSafeUser(targetUser),
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
          sender: toSafeUser(connectedUser),
          recipient: toSafeUser(targetUser),
          role: "CHALLENGER",
        },
      });
      sendEvent(targetUser.ws, {
        type: "INVITATION",
        payload: {
          invitationId,
          status: "PENDING",
          sender: toSafeUser(connectedUser),
          recipient: toSafeUser(targetUser),
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
              sender: toSafeUser(connectedUser),
              recipient: toSafeUser(invite.toUser),
              role: "RECIPIENT",
            },
          });
          sendEvent(connectedUser.ws, {
            type: "INVITATION",
            payload: {
              invitationId: inviteId,
              status: "CANCELLED",
              sender: toSafeUser(connectedUser),
              recipient: toSafeUser(invite.toUser),
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
          sender: toSafeUser(invite.fromUser),
          recipient: toSafeUser(connectedUser),
          role: "CHALLENGER",
          reason: `${connectedUser.username} declined the challenge`,
        },
      });
      sendEvent(connectedUser.ws, {
        type: "INVITATION",
        payload: {
          invitationId: action.payload.invitationId,
          status: "DECLINED",
          sender: toSafeUser(invite.fromUser),
          recipient: toSafeUser(connectedUser),
          role: "RECIPIENT",
        },
      });

      // Keep challenger in queue if they were searching
      if (invite.fromUser.ws.readyState === WebSocket.OPEN) {
        if (!waitingQueue.some((u) => u.id === invite.fromUser.id)) {
          waitingQueue.push(invite.fromUser);
        }
        sendEvent(invite.fromUser.ws, {
          type: "QUEUE_STATUS",
          payload: { status: "WAITING" },
        });
      }
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
            sender: toSafeUser(invite.fromUser),
            recipient: toSafeUser(invite.toUser),
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
            sender: toSafeUser(invite.fromUser),
            recipient: toSafeUser(invite.toUser),
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
