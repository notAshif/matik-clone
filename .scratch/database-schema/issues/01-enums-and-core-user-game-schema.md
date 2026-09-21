# 01: Enums and Core User & Game Tables

**What to build:**  
Core identity, game session lifecycle, and player participation schema. Defines the PostgreSQL enums (`game_status_enum`), `users` table for authentication, `games` table for match sessions (status, timing, time limit), and `game_members` table linking users to games with individual player scores, ranks, and winner flags.

**Blocked by:** None (can start immediately)

**Status:** resolved

## Acceptance criteria
- [x] PostgreSQL enum `game_status_enum` (`waiting`, `in_progress`, `completed`, `abandoned`) defined.
- [x] `users` table with `id`, `username` (unique), `email` (unique), `password`, `createdAt`, and `updatedAt`.
- [x] `games` table with `id`, `status` (enum), `timeLimit` (default 60s), `startTime`, `endTime`, and `createdAt`.
- [x] `game_members` table with `id`, foreign keys to `games.id` and `users.id` (with cascade delete), `score` (default 0), `rank`, `isWinner` (default false), and `joinedAt`.
- [x] Unique constraint on `(game_id, user_id)` in `game_members` to prevent duplicate membership.
