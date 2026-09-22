# 02: Robust Presence & Connection Lifecycle

**What to build:** Authenticate incoming WebSocket connections using JWT tokens (`decode.userId`), maintain an in-memory map of active connected users, broadcast safe online player lists to all clients, and safely handle disconnections with zero memory leaks.

**Blocked by:** 01: WebSocket Protocol & Type Definitions

**Status:** resolved

- [x] Authenticate WebSocket handshake via `token` query param using `JWT_SECRET` and correctly extract `decode.userId`.
- [x] Maintain `connectedUsers: Map<number, ConnectedUser>` storing user ID, username, and socket instance.
- [x] Safe `ONLINE_USERS` broadcast sends only `{ id, username }` to all connected clients (preventing circular `ws` serialization errors).
- [x] Implement `ws.on("close")` to reliably unregister disconnected users from the presence map, flush them from matchmaking queues, and broadcast updated online lists.
