# 05: Answer Input, Wrong-Answer Retry, and Post-Game Modal

**What to build:** Implement real-time answer input with Enter key submission, visual green tick/red cross indicators, retry on wrong answer without advancing question, and an end-of-game summary modal with Rematch and Search Next Game actions.

**Blocked by:** 04: Game Arena HUD & Central Question Display

**Status:** resolved

- [x] Update backend WebSocket handler (`apps/websocket/index.ts`) so incorrect answers do not increment `userQuestionIndex`, keeping the user on the same question.
- [x] Bottom-centered answer input field with auto-focus and Enter key submission.
- [x] Visual submission feedback:
  - Green border glow with green checkmark tick SVG when answer is correct (increments score, clears input, advances question).
  - Red border glow with red cross SVG when answer is incorrect (shakes, preserves current question for retry).
- [x] Victory / Defeat Modal displaying outcome (Victory, Defeat, Draw), final scores, winner, and rating change.
- [x] Post-game action buttons: "Rematch" (challenges the same opponent), "Search for Next Game" (triggers radar queue), and "Back to Dashboard".
- [x] Custom inline SVG icons for tick, cross, timer, radar, trophy, users, and actions.
