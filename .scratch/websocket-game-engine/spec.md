# PRD: Real-Time WebSocket Game Engine & Protocol (Matik)

**Status:** Approved (via /grill-me session)  
**Target:** `apps/websocket/` & `packages/common/`  
**Dependencies:** `@repo/database`, `@repo/common`, `ws`, `jsonwebtoken`, `zod`

---

## 1. Overview & Objectives

Matik is a fast-paced multiplayer arithmetic battle. Players challenge each other in 60-second real-time speed sprints, solving mental math problems as quickly and accurately as possible.

This document defines the WebSocket architecture, message protocol, matchmaking rules, in-memory game state, and database persistence lifecycle for `apps/websocket`.

---

## 2. Core Game Loop & Design Decisions (Resolved in Grill-Me)

1. **Matchmaking Flow:**
   - **Public Queue:** Players can click "Find Match" (`JOIN_QUEUE`) to be automatically paired with another waiting player.
   - **Direct Friend Challenges:** Players can select any user from the online list (`INVITE_PLAYER`). The opponent receives `GAME_INVITATION` and responds with `ACCEPT_GAME` or `DECLINE_GAME`.

2. **Gameplay Style:**
   - **Independent Speed Race:** Both players race for 60 seconds at their own pace. Submitting an answer instantly validates, increments the score if correct, updates the opponent via live `SCORE_UPDATE`, and serves the next question.

3. **Anti-Cheat Question Delivery:**
   - Server-streamed: Future questions and answers are never leaked to the client. `START_GAME` delivers only Question #1. On each `SUBMIT_ANSWER`, the server delivers the next question.

4. **Authoritative Match Lifecycle & Timer:**
   - The server maintains a strict 60-second timer. When the timer expires, the server broadcasts `GAME_OVER` and writes match results to the PostgreSQL database (`games`, `game_members`, `question_answers`, `ratings`).
   - If a player disconnects mid-match, the game ends immediately with a forfeit victory for the opponent.

5. **Presence & Connection Safety:**
   - Token authentication validates `userId` from JWT.
   - The WebSocket instance (`ws`) is strictly kept in server memory and never serialized in `ONLINE_USERS`.
   - Disconnections immediately clean up online lists, active queues, and ongoing matches.

---

## 3. WebSocket Message Protocol (Discriminated Unions)

### 3.1 Client Actions (Upstream: Client -> Server)

| Type | Payload | Description |
| :--- | :--- | :--- |
| `JOIN_QUEUE` | `{}` | Join public matchmaking queue |
| `LEAVE_QUEUE` | `{}` | Leave public matchmaking queue |
| `INVITE_PLAYER` | `{ targetUserId: number }` | Challenge an online user |
| `ACCEPT_GAME` | `{ invitationId: string }` | Accept an invitation |
| `DECLINE_GAME`| `{ invitationId: string }` | Decline an invitation |
| `SUBMIT_ANSWER`| `{ gameId: number, questionId: number, answer: number, timeTakenMs: number }` | Submit answer for current question |

### 3.2 Server Events (Downstream: Server -> Client)

| Type | Payload | Description |
| :--- | :--- | :--- |
| `ONLINE_USERS` | `{ users: Array<{ id: number, username: string }> }` | Broadcast of connected users |
| `QUEUE_STATUS` | `{ status: "WAITING" \| "MATCHED" }` | Notification of queue state |
| `GAME_INVITATION` | `{ invitationId: string, from: { id: number, username: string } }` | Push challenge notification |
| `START_GAME` | `{ gameId: number, timeLimit: number, opponent: { id: number, username: string }, firstQuestion: Question }` | Match start signal |
| `ANSWER_RESULT` | `{ questionId: number, isCorrect: boolean, correctAnswer: number, myScore: number, nextQuestion: Question }` | Response to submitted answer |
| `SCORE_UPDATE` | `{ scores: Record<number, number> }` | Real-time score update of both players |
| `GAME_OVER` | `{ gameId: number, winnerId: number \| null, scores: Record<number, number>, reason: "TIME_UP" \| "PLAYER_FORFEIT" }` | Final game termination |

---

## 4. In-Memory State & Concurrency Model

```
connectedUsers: Map<number, ConnectedUser> (userId -> { id, username, ws })
waitingQueue: ConnectedUser[] (FIFO queue of unmatched players)
pendingInvitations: Map<string, { fromUserId: number, toUserId: number, createdAt: Date }>
activeGames: Map<number, ActiveGameState>
```

### `ActiveGameState` Structure
- `id`: Database game ID
- `players`: `[ConnectedUser, ConnectedUser]`
- `scores`: `Record<userId, number>`
- `questions`: Generated array of `Question` objects with precalculated answers
- `userQuestionIndex`: `Record<userId, number>`
- `timer`: Server countdown `NodeJS.Timeout`
- `startTime`: `Date`
- `timeLimit`: 60 seconds

---

## 5. Database Integration & Settlement

When `GAME_OVER` fires:
1. Update `games` table: `status = 'completed'` (or `'abandoned'`), `startTime`, `endTime`.
2. Insert `game_members`: final `score`, `rank`, `isWinner`.
3. Batch insert `question_answers`: user submissions, correctness, latency.
4. Calculate and update Elo ratings in `ratings` table.
