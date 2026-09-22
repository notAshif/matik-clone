# 03: Dashboard Profile & Radar Matchmaking UI

**What to build:** Implement the main Dashboard interface featuring a detailed User Profile card (avatar, username, rating, friends, recent game history) and a Play Game action card that opens an animated radar matchmaking overlay.

**Blocked by:** 02: Global WebSocket Context & Online Users Story Bar

**Status:** resolved

- [x] Fetch and display user profile info from `GET /api/v1/auth/me` (avatar, username, Elo rating, friends count, last game played details).
- [x] Build a "Play 60s Speed Match" game card on the dashboard with high-tech gaming aesthetics.
- [x] Implement the animated Radar Searching modal: rotating scanner sweep, pulsing sonar rings, searching status, and a "Cancel Search" (`LEAVE_QUEUE`) button.
- [x] Automatically dismiss the radar and navigate to `/game` when the server broadcasts `START_GAME`.
