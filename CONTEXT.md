# Domain Model Glossary: Matik

This document defines the canonical domain vocabulary for the Matik real-time competitive math platform.

---

### Entities & Concepts

#### Player / User
An authenticated account identified by a unique ID, username, and email. A Player possesses a persistent **Rating**, a list of **Game Memberships**, and an avatar identifier.

#### Rating (Elo)
A numerical skill measurement representing a Player's competitive proficiency.
- **Default Starting Rating**: 1200.
- **Rating Adjustment**: Calculated upon conclusion of every Match. A victory increments the Player's rating; a defeat decrements it. Draws or ties result in negligible/zero change.
- **Rating Event**: A historical record capturing `ratingBefore`, `ratingAfter`, and `ratingChange` associated with a specific Match.

#### Match (Game)
A timed 1v1 competitive session between two distinct Players.
- **Status**: `waiting` -> `in_progress` -> `completed` (or `abandoned`).
- **Duration**: Fixed countdown (default 60 seconds) synchronized across both clients.
- **Questions**: An ordered series of arithmetic questions generated on the server with deterministic operands and operators (`+`, `-`, `*`, `/`).

#### Matchmaking Queue
A voluntary lobby state. Players must explicitly choose to enter the Queue (`JOIN_QUEUE`). Entering the dashboard does **not** auto-queue the Player.
- **Queue Statuses**: `IDLE` (exploring dashboard), `WAITING` (in matchmaking radar).

#### Direct Challenge (Invitation)
A 1v1 duel request dispatched directly to an online user or practice sparring bot, bypassing the public Matchmaking Queue. Managed via a single unified `INVITATION` event with explicit status flags:
- **Lifecycle States**:
  - `PENDING`: Initiated by Challenger (`INVITATION` with `status: "PENDING"`, carrying `sender` and `recipient`). Expires after a 30-second TTL.
  - `ACCEPTED`: Recipient accepts (`ACCEPT_GAME`), triggering immediate transition into a `Match` (`START_GAME`).
  - `DECLINED`: Recipient declines (`DECLINE_GAME`) or is busy/offline; broadcast via `INVITATION` (`status: "DECLINED"`).
  - `CANCELLED / EXPIRED`: Sender revokes (`CANCEL_INVITATION`) or 30s timeout elapses; broadcast via `INVITATION` (`status: "EXPIRED"` or `"CANCELLED"`).
  - `COLLISION (Mutual Challenge)`: Recipient simultaneously challenges sender; server auto-resolves into an immediate `Match`.

#### Bot Opponent (Sparring Challenger)
An automated simulated Player (e.g. *EulerBot*, *GaussBot*) available for immediate practice duels and queue timeout fallbacks.
- Possesses dynamic arithmetic solve rates mimicking human reaction times (2.5s - 6.5s per question).
- Prevents matchmaking deadlocks during low-traffic periods or solo local testing.

#### Header HUD
The persistent global bar containing the Player's identity, avatar, live Rating pill, and session actions. Replaces full-page dashboard sidebars with an Apple-style floating or fixed frosted glass header.
