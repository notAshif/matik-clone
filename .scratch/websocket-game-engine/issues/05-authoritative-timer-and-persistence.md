# 05: Authoritative Game Timer, Disconnect Forfeit & Persistence

**What to build:** Enforce a strict 60-second server countdown timer for each active match, handle mid-match forfeits on player disconnect, conclude matches by broadcasting `GAME_OVER`, and persist match results, scores, answers, and ratings into PostgreSQL via Drizzle ORM.

**Blocked by:** 04: Question Generator & Real-Time Speed Race Loop

**Status:** resolved

- [x] Run a server-authoritative 60-second timer per match; broadcast `GAME_OVER` when time expires.
- [x] On mid-game disconnect, trigger immediate `GAME_OVER` with `reason: "PLAYER_FORFEIT"` awarding victory to the remaining opponent.
- [x] Insert or update match records in PostgreSQL: `games` (completed status, start/end timestamps), `game_members` (scores, winner flag, ranks).
- [x] Record player question answers in `question_answers` table.
- [x] Calculate and record updated ratings in `ratings` table.
