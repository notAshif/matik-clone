# 03: Non-Intrusive Dashboard with Play Hub & Match History

**What to build:**
Rebuild the main dashboard stage to allow peaceful exploration without forced matchmaking. Features an active players story bar at the top with direct 1v1 challenge triggers, a tactile "Ranked 1v1 Arena" hero card with a prominent "Find Match" button that explicitly opens the radar matchmaking modal on click (with cancel option), and a recent battle history feed displaying past match outcomes and Elo rating deltas.

**Blocked by:** 02: Global Header HUD with User Profile & Live Rating Pill

**Status:** ready-for-agent

## Acceptance Criteria
- [ ] Landing on the dashboard leaves the player in `IDLE` state with no radar popup or auto-search.
- [ ] Active players story bar renders online users horizontally with rounded avatars, usernames, and click-to-challenge interaction.
- [ ] Hero Matchmaking card explains the 60s arithmetic duel rules and features a distinct, glowing "Find Match" CTA button.
- [ ] Clicking "Find Match" sends `JOIN_QUEUE` and opens the radar matchmaking modal.
- [ ] Radar modal can be dismissed/cancelled via "Cancel Search", sending `LEAVE_QUEUE` and returning to idle dashboard.
- [ ] "Recent Battles" feed lists the player's past games showing opponent name, outcome (Victory/Defeat/Draw), and Elo rating change ($\pm \Delta$).
