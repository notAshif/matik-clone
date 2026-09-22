# 04: Apple + Emil Kowalski Game Arena & Animated Post-Game Modal

**What to build:**
Rebuild the 1v1 Arena HUD and Post-Game modal with high-craft design engineering. Top match HUD with player cards and countdown timer, center arithmetic question display, low-latency answer input with green tick on correct and red shake on incorrect (staying on same question for retry), and post-match modal with victory/defeat badge, animated rolling rating counter (`1,200 ➔ 1,228 (+28)`), and rematch/dashboard actions.

**Blocked by:** 03: Non-Intrusive Dashboard with Play Hub & Match History

**Status:** resolved

## Acceptance Criteria
- [x] Top HUD displays Player 1 (Left) and Player 2 (Right) with avatar, username, rating, and live solved question counter.
- [x] Center HUD displays the 60-second countdown in an Apple-style rounded border container.
- [x] Center stage renders the current question with high optical legibility (`op1 [operator] op2 = ?`).
- [x] Bottom-centered answer input provides low-latency feedback: green tick on correct and advance, red flash/shake on incorrect with input cleared while staying on the question for retry.
- [x] Post-game modal appears upon match conclusion or opponent forfeit with victory/defeat header.
- [x] Modal features an animated counter rolling from `ratingBefore` to `ratingAfter` displaying the exact Elo change (`+28` in emerald or `-20` in rose).
- [x] CTAs allow direct "Play Again" (re-queue) or "Return to Dashboard" (refreshes user profile and rating).
