# 03: Matchmaking Queue & Direct Challenge Invitations

**What to build:** Allow players to find opponents either through a public random matchmaking queue or by directly challenging an online player. When two players are paired, instantiate a new active game session and notify both players.

**Blocked by:** 02: Robust Presence & Connection Lifecycle

**Status:** resolved

- [x] Support `JOIN_QUEUE` and `LEAVE_QUEUE` actions with FIFO queue pairing: when 2 players are waiting, pair them automatically into a game.
- [x] Support direct challenge invitations via `INVITE_PLAYER`: validate target user is online and emit `GAME_INVITATION`.
- [x] Handle `ACCEPT_GAME` (starts the match between challenger and recipient) and `DECLINE_GAME` (notifies challenger).
- [x] Cancel pending invites and dequeue players automatically if they disconnect before a match starts.
