# 04: Game Arena HUD & Central Question Display

**What to build:** Build the core Game Arena layout featuring player cards for both competitors, a central 60-second countdown timer, and a large centered arithmetic question display.

**Blocked by:** 03: Dashboard Profile & Radar Matchmaking UI

**Status:** resolved

- [x] Top HUD: Left player card (current user) and Right player card (opponent), each showing avatar, username, current rating, and rounded-md container.
- [x] Render a live solved questions counter underneath each player's profile card, reacting to `SCORE_UPDATE` events.
- [x] Central countdown timer with rounded-md border showing remaining seconds (60s down to 0).
- [x] Centered question component showing operand 1, operand 2, and the mathematical operator (`+`, `-`, `*`, `/`) in high-contrast, large typography.
