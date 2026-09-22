# 02: Global WebSocket Context & Online Users Story Bar

**What to build:** Establish a persistent WebSocket connection upon user login, expose incoming events and client actions via a global `useWebSocket` hook, and render the top category/story bar of active online users with rounded-full avatars and 1v1 challenge capabilities.

**Blocked by:** 01: Backend Fixes, Client Routing & Auth Pages

**Status:** resolved

- [x] Create `WebSocketProvider` and `useWebSocket` hook at the app root that connects to `ws://localhost:4000?token=<jwt>` when authenticated.
- [x] Maintain live `onlineUsers` state from `ONLINE_USERS` server events.
- [x] Build top horizontal category bar displaying online users with circular avatars, usernames, and green online status indicators.
- [x] Implement direct 1v1 challenge trigger (`INVITE_PLAYER`) when an online player avatar is clicked.
- [x] Render an incoming invitation pop-up toast with "Accept" and "Decline" actions when `GAME_INVITATION` is received.
