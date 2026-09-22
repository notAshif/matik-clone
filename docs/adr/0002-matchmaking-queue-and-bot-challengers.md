# ADR 0002: Matchmaking Queue Lifecycle, Sparring Bots, and Connection Handshake

## Context
Matik's real-time features rely on a 1v1 WebSocket architecture. During development, testing, and off-peak production hours, two human players are rarely queued simultaneously. Consequently:
1. Solo players entering the Matchmaking Queue (`JOIN_QUEUE`) stall indefinitely.
2. Direct Challenges (`INVITE_PLAYER`) cannot be tested or initiated without coordinated second-browser sessions.
3. React Strict Mode and async database lookups on server connection created race conditions where initial client actions were dropped and sockets were prematurely closed.

## Decision
1. **Queue Timeout with Sparring Bot Fallback**:
   - If a player enters the Matchmaking Queue and no human opponent is matched within 8 seconds, the server automatically spawns an simulated Bot Challenger (e.g. `EulerBot` or `GaussBot`, matching user Elo $\pm 50$).
   - The bot responds to arithmetic questions with realistic, human-distributed solving latencies (2.5s - 6.5s per question with occasional 10% error rate).
   - Rating calculations follow ADR 0001 upon match conclusion.
2. **Interactive Sparring Bot in Online Bar**:
   - The `OnlineStoryBar` always includes a persistent sparring bot (ID `-1`, `GaussBot [Practice]`) allowing immediate direct challenge initiation and duel testing with zero dependencies.
3. **Synchronous Connection Handshake & Action Buffer**:
   - In `apps/websocket`, `ws.on("message")` is attached immediately and synchronously upon the `connection` event. Any messages arriving before the user's DB profile query completes are queued and processed in FIFO order.
   - In `apps/frontend`, `WebSocketContext` buffers outgoing actions if the socket is in `CONNECTING` state and flushes them immediately on `OPEN`. Socket cleanup guards against calling `.close()` on connecting sockets.
4. **Single Unified `INVITATION` Event**:
   - Instead of fragmented events (`INVITATION_SENT`, `GAME_INVITATION`, `INVITATION_DECLINED`, `INVITATION_EXPIRED`), all invitation state changes are communicated via a single, symmetric `INVITATION` server event with `status` (`PENDING` | `DECLINED` | `EXPIRED` | `CANCELLED`), `sender`, and `recipient`. This radically simplifies frontend reducer/state management and avoids event proliferation.

## Consequences
- Solo players and developers always experience immediate gameplay without matchmaking deadlocks.
- Zero dropped messages during cold start, page refreshes, and React 18 Strict Mode mounts.
- Full UI state synchronicity between challenger and challenged player without ghost pending toasts.
