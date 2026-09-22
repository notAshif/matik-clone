# 01: Fix WebSocket Auto-Queue & Implement Server-Side Elo Rating Engine

**What to build:**
Fix the auto-queue bug in `@repo/websocket` so connected players remain `IDLE` on the dashboard until they intentionally request a match. Implement a complete server-side Elo rating engine ($K=32$) with a minimum floor of 100 that recalculates player ratings whenever a 1v1 match concludes (normal timeout/game end or mid-game forfeit). Persist the rating change records into the `ratings` database table and broadcast the updated ratings and score deltas in the `GAME_OVER` event payload.

**Blocked by:** None (can start immediately)

**Status:** resolved

## Acceptance Criteria
- [x] WebSocket server does NOT emit `QUEUE_STATUS: WAITING` upon client connection (remains `IDLE` until client sends `JOIN_QUEUE`).
- [x] Elo calculation function implements $E_A = \frac{1}{1 + 10^{(R_B - R_A)/400}}$ and $R' = \text{round}(R + 32 \times (S - E))$ with floor at 100.
- [x] Normal match finish computes winning player rating increment and losing player rating decrement based on their pre-match ratings.
- [x] Player forfeit / disconnect awards loss ($S=0$) to forfeiting player and win ($S=1$) to the remaining opponent.
- [x] Rating transition rows (`userId`, `gameId`, `ratingBefore`, `ratingAfter`, `ratingChange`) are inserted into the `ratings` database table.
- [x] `GAME_OVER` server event payload includes `ratings: { [userId]: { ratingBefore: number, ratingAfter: number, ratingChange: number } }`.
