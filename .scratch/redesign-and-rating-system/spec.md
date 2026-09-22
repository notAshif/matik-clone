# Specification: Complete UI Redesign, Non-Intrusive Matchmaking, Elo Rating Engine, and Global Header Profile

**Status:** ready-for-agent

---

## Problem Statement
1. **Forced Matchmaking on Dashboard Entry:** Upon logging in, the WebSocket server immediately sent a `QUEUE_STATUS: WAITING` event, triggering the radar searching modal instantly and forcing the user into a game before they could view their dashboard, stats, or online players.
2. **Missing Rating Adjustments:** When a match concluded or a player forfeited, ratings were never computed or stored in the database. The `ratings` table remained completely empty, leaving user ratings static at 1200.
3. **Cluttered Layout & Missing Header Profile:** The user profile was placed inside a heavy sidebar rather than a clean, accessible global header, reducing available screen space and lacking Apple-grade fluid navigation.
4. **Current UI Aesthetic Inconsistencies:** The existing UI lacked high-craft design engineering polish—such as tactile spring micro-interactions (`:active { transform: scale(0.97) }`), frosted glass depth (`backdrop-blur-md`), and dynamic numeric count-up animations for rating gains and losses.

---

## Solution
1. **Server Bug Fix & Intentional Matchmaking:** Remove the auto-queue emission on WebSocket connection (`apps/websocket/index.ts:398`). Matchmaking queue state defaults to `IDLE`. A user only enters the radar queue when they explicitly click the "Find Match" button on the dashboard.
2. **Server-Side Elo Rating Calculation Engine:** Compute Elo rating adjustments ($K=32$) on game end or forfeit in the WebSocket server. Persist transitions to the `ratings` table and broadcast updated ratings in the `GAME_OVER` payload.
3. **Persistent Frosted Glass Header HUD:** Place the Player profile at the top header with user avatar, username, live rating badge (`⚡ 1,240 ELO`), and quick actions (sign out, match status).
4. **Complete Emil Kowalski + Apple Design System Overhaul:** Rebuild the frontend UI from a clean slate featuring:
   - Polished Auth screens (Login & Registration) with refined dark slate materials and instant input validation.
   - Non-intrusive Dashboard with active players story bar, ranked 1v1 play hub card, and recent battle history.
   - Fluid 1v1 Arena HUD with tactile answer inputs (instant visual feedback with green tick / red cross and spring response).
   - Post-match victory/defeat modal with animated rating roll (`1,200 ➔ 1,228 (+28)`), rematch challenge, and clean dashboard return.

---

## User Stories

1. As an authenticated player, I want to land on the dashboard in an idle state without being forced into matchmaking, so that I can explore my stats and match history at my own pace.
2. As a player, I want to see my profile, avatar, username, and live Elo rating displayed prominently in the global header, so that my identity is always visible across all views.
3. As a player, I want to click an explicit "Find Match" button on the dashboard when I feel ready, so that the radar search opens only on my direct command.
4. As a player in the radar matchmaking queue, I want to be able to cancel search at any moment, so that I can return to the dashboard without penalty.
5. As a victorious player, I want my rating to increment based on my opponent's relative rank, so that my skill progression is accurately rewarded.
6. As a defeated player, I want my rating to decrement according to the Elo formula, so that the competitive ranking system remains fair and balanced.
7. As a player whose opponent forfeits or disconnects, I want to be awarded a victory and rating increase, so that I am not punished for opponent abandonment.
8. As a player who forfeits or leaves mid-game, I want my rating to decrement as a loss, so that rage-quitting is disincentivized.
9. As a player finishing a match, I want to see a post-game summary modal with an animated counter rolling from my old rating to my new rating, so that I get immediate, satisfying feedback on my progress.
10. As a player on the dashboard, I want to see an active players story bar at the top, so that I can see who is currently online.
11. As a player, I want to click any online user in the active players bar to send them a direct 1v1 challenge, so that I can play against specific peers.
12. As a challenged player, I want to see a fluid toast invitation with Accept and Decline buttons, so that I can decide whether to accept the duel.
13. As a player in the 1v1 arena, I want tactile, low-latency feedback when typing my answer, with an instant green tick on correct and red flash on incorrect without page stutter.
14. As an unauthenticated visitor, I want a beautiful, dark-themed login and registration page with smooth focus rings and instant error feedback, so that onboarding feels effortless.
15. As a player, I want buttons to exhibit a physical spring press feedback (`scale(0.97)` on pointer-down), so that the entire interface feels responsive and alive.
16. As a player, I want to sign out safely from the header profile dropdown, so that my session is cleared from local storage and the socket disconnects cleanly.

---

## Implementation Decisions

### 1. WebSocket Server (`@repo/websocket`)
- **Fix Initial Queue Event**: Remove the automatic `sendEvent(ws, { type: "QUEUE_STATUS", payload: { status: "WAITING" } })` emitted immediately upon connection. Initial connection defaults to idle.
- **Elo Rating Algorithm**:
  - Implement `calculateElo(ratingA: number, ratingB: number, scoreA: number, k = 32)`.
  - When game completes or a player forfeits in `finishGame()`, calculate `ratingBefore`, `ratingAfter`, and `ratingChange` for both players with a floor of `100`.
  - Insert records into the `ratings` database table.
  - Include rating deltas and new ratings in the `GAME_OVER` server broadcast event payload.

### 2. Global Header Component (`HeaderHUD`)
- Fixed at the top with `backdrop-blur-xl bg-slate-900/80 border-b border-white/10`.
- Left side: Matik brand logo + cyber arithmetic badge.
- Right side: User profile cluster including avatar with subtle online indicator, username, a live rating pill (`⚡ 1,240 ELO` with emerald gradient sheen), and a sign-out trigger.

### 3. Dashboard Experience (`DashboardPage`)
- **Story Bar**: Horizontal scrolling bar of online users with rounded avatars and click-to-challenge interaction.
- **Hero Arena Hub Card**: Prominently displays the 60-second ranked arithmetic mode with game rules and a glowing "Find Match" CTA button.
- **Match History Feed**: Displays the player's recent battles showing outcome (Win/Loss/Draw), opponent name, score differential, and Elo rating change.

### 4. 1v1 Arena & Post-Game Modal (`GamePage`, `GameOverModal`)
- Synchronized 60-second countdown in an Apple-style rounded HUD container.
- Center arithmetic question card with clear contrast and optical sizing.
- High-contrast answer input with spring feedback, instant green tick on correct and red shake on incorrect (staying on same question for retry).
- GameOverModal displaying victory/defeat outcome with Emil Kowalski-inspired animated rating counter rolling from `ratingBefore` to `ratingAfter` (+/- change), rematch button, and return to dashboard button.

### 5. Design Engineering Aesthetics
- Emil Kowalski micro-interactions: `:active { transform: scale(0.97) }`, `transition: transform 150ms cubic-bezier(0.16, 1, 0.3, 1)`.
- Apple design principles: Direct manipulation, continuous feedback on pointerdown, translucent materials (`backdrop-blur-md`).

---

## Testing Decisions
- **Seam 1 (Elo Calculation Unit Tests)**: Test Elo calculation function in isolation (balanced players, upset victory, upset defeat, draws, rating floor constraint).
- **Seam 2 (WebSocket Match End & Rating Persistence)**: Test `finishGame` persists rows to `ratings` table with correct before/after values and transmits updated payload in `GAME_OVER`.
- **Seam 3 (Frontend Typecheck & Build)**: Verify `turbo run check-types` and `vite build` compile with 0 TypeScript or bundle errors.
- **Seam 4 (End-to-End User Flow Verification)**: Verify that landing on dashboard remains IDLE with radar hidden until "Find Match" is clicked; verify header displays profile and live rating.

---

## Out of Scope
- Matchmaking ranking tiers (Bronze, Silver, Gold badges - deferred to subsequent release).
- Friend list search and management (covered in future social ticket).
- Custom math operator toggles (fixed to standard arithmetic operators for v1).

---

## Further Notes
- Adheres to `ADR 0001: Elo Rating System ($K=32$)`.
- Retains server-authoritative anti-cheat validation where answers and question progression are validated strictly on the WebSocket server.
