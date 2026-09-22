# PRD: Frontend Client & Multiplayer Game UI (Matik)

**Status:** ready-for-agent  
**Target:** `apps/frontend/app/`  
**Dependencies:** `react`, `react-dom`, `react-router-dom`, `@repo/common`, Tailwind CSS

---

## 1. Problem Statement

Matik has a real-time arithmetic WebSocket server and an Express authentication backend, but lacks a user interface. Players cannot register or log in, view their profile and rating, see which players are online, initiate matchmaking with visual feedback, or play the 60-second multiplayer arithmetic speed race.

---

## 2. Solution

Build a client-side React 19 application powered by Vite, Tailwind CSS, and `react-router-dom` that integrates seamlessly with both the Express REST API (`http://localhost:8000`) and the WebSocket server (`ws://localhost:4000`).

The application features:
1. **Authentication Flow:** Unified Login and Registration forms with email & password validation, storing JWT in `localStorage`.
2. **Dashboard:**
   - **Profile Sidebar/Card:** Avatar, username, Elo rating, friends count, and stats from the last played game.
   - **Online Users Story Bar:** Rounded-full avatars of active connected users at the top of the dashboard with direct 1v1 challenge buttons.
   - **Play Game Card & Radar Matchmaker:** A game lobby card opening an animated radar scanner searching for an opponent (`JOIN_QUEUE`).
3. **Game Arena:**
   - **Top HUD:** Player cards (left and right) displaying avatar, username, current rating, and solved question count counter.
   - **Center Timer:** Rounded border countdown display (60s).
   - **Center Stage Question:** Large arithmetic problem with operand 1, operand 2, and operator (`+`, `-`, `*`, `/`).
   - **Bottom Answer Box:** Focused input field with real-time feedback:
     - **Correct:** Green glow with right tick SVG, score increments, advances to next question.
     - **Incorrect:** Red shake with cross SVG, stays on the same question so the player can retry.
   - **Victory / Defeat Modal:** Displays match outcome, winner, rating change, with "Rematch", "Search for Next Game", and "Back to Dashboard" buttons.
4. **Clean Custom SVG Icons:** Handcrafted SVG icons for radar scanner, tick, cross, avatars, trophy, logout, and math operators.

---

## 3. User Stories

1. As a new user, I want to register with my email and password so I can create an account on Matik.
2. As a returning user, I want to log in with my email and password and have my session remembered via JWT.
3. As a logged-in user, I want to view my username, avatar, current rating, and recent game summary on the dashboard.
4. As an active player, I want to see a horizontal story-style bar of all currently online players at the top of my dashboard.
5. As a player, I want to click an online player to challenge them directly to a 1v1 math match.
6. As a challenged player, I want to receive an on-screen challenge notification with "Accept" and "Decline" actions.
7. As a player, I want to click "Play Game" and see a futuristic radar scanning interface while waiting for matchmaking.
8. As a queued player, I want to be able to cancel matchmaking and return to the dashboard.
9. As a player matched with an opponent, I want the screen to automatically transition to the Game Arena.
10. As a competitor, I want to see my opponent's live profile, rating, and real-time solved question count during the match.
11. As a competitor, I want to see a central 60-second countdown timer keeping both players synced.
12. As a competitor, I want to solve arithmetic questions one-by-one by typing in the answer field and pressing Enter.
13. As a competitor, I want a correct answer to display a green tick and immediately advance to the next question.
14. As a competitor, I want a wrong answer to display a red cross and keep me on the same question so I can correct my mistake.
15. As a competitor, I want to see a game-over summary modal when time expires or when an opponent forfeits.
16. As a competitor on the game-over screen, I want options to request a rematch, start a new radar search, or return to the dashboard.

---

## 4. Implementation Decisions

1. **Routing:** Use `react-router-dom` with routes:
   - `/login`: Login screen.
   - `/register`: Registration screen.
   - `/`: Protected Dashboard route (redirects to `/login` if no JWT).
   - `/game`: Protected Game Arena route.
2. **WebSocket Integration:** Create `WebSocketContext` and `useWebSocket` hook at the root level so WebSocket connectivity, presence updates, and incoming challenge toasts persist across page navigations.
3. **Backend Route Adjustments:**
   - In `apps/backend/index.ts`: Fix `app.use("/api/v1/auth", AuthRoute)` and `app.use(cors())`.
   - In `apps/backend/routes/auth.router.ts`: Fix `req.userId` access in `/me`.
   - In `apps/backend/middleware/middleware.ts`: Verify `extractToken` correctly.
4. **WebSocket Engine Wrong Answer Adjustment:**
   - In `apps/websocket/index.ts`: Only advance `userQuestionIndex` when `isCorrect === true`. If `isCorrect === false`, keep the player on the same question.
5. **Radar Animation:** CSS keyframe pulse and rotating sweep beam creating a radar aesthetic.
6. **Icons:** Pure inline SVG components without bulky third-party icon packages.

---

## 5. Testing Decisions

- **Seam:** High-level component and integration verification using Vite build and browser DevTools verification.
- **Protocol Verification:** Ensure client actions sent match `@repo/common` schemas and server events parse without loss.
- **Type Checking:** Run `tsc --noEmit` across `@repo/frontend` ensuring strict TypeScript adherence.

---

## 6. Out of Scope

- Audio sound effects (can be added in future enhancement).
- OAuth social logins (Google/GitHub).
- Complex friend-request management pages (the dashboard shows friend counts and online users directly).
