# 02: Global Header HUD with User Profile & Live Rating Pill

**What to build:**
A persistent floating frosted-glass global navigation header HUD across all authenticated views. Displays the Matik brand and lightning logo on the left, and a sleek user profile cluster on the right featuring the user's avatar with online halo, username, a live rating pill (`⚡ 1,240 ELO` with subtle emerald gradient sheen), and a sign-out trigger with instant tactile feedback.

**Blocked by:** 01: Fix WebSocket Auto-Queue & Implement Server-Side Elo Rating Engine

**Status:** resolved

## Acceptance Criteria
- [x] Header is fixed at the top with `backdrop-blur-xl bg-slate-900/80 border-b border-white/10`.
- [x] Left section displays the Matik logo and platform title.
- [x] Right section displays the Player's avatar, username, and live rating pill (`⚡ [Rating] ELO`).
- [x] Rating updates reactively whenever the user profile hydrates or a match finishes.
- [x] Accessible Sign Out button / trigger clears auth tokens and disconnects WebSocket cleanly.
- [x] Responsive behavior: collapses neatly on mobile viewports without horizontal scroll.
