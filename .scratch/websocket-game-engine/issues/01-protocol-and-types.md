# 01: WebSocket Protocol & Type Definitions

**What to build:** Define the complete typed contract for all messages exchanged between the client and the WebSocket server. Any message sent over the wire must parse into strongly-typed client actions or server events with schema validation, preventing malformed payloads from crashing the game engine.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] Type definitions and Zod schemas created for all client actions (`JOIN_QUEUE`, `LEAVE_QUEUE`, `INVITE_PLAYER`, `ACCEPT_GAME`, `DECLINE_GAME`, `SUBMIT_ANSWER`).
- [x] Type definitions created for all server events (`ONLINE_USERS`, `QUEUE_STATUS`, `GAME_INVITATION`, `START_GAME`, `ANSWER_RESULT`, `SCORE_UPDATE`, `GAME_OVER`).
- [x] Exported types available for import across packages (`@repo/common` / WebSocket server).
- [x] Safe user and public question types strip out sensitive data (no WebSocket references in serialized user payloads, no `correctAnswer` in public question payloads).
