# 03: Social Friend System and Elo Ratings Tables

**What to build:**  
Player relationship graphs and competitive rating history. Defines the `friend_status_enum` (`pending`, `accepted`, `rejected`), the `friends` table tracking friend requests with sender/receiver constraints, and the `ratings` table storing Elo history (`ratingBefore`, `ratingAfter`, `ratingChange`) per game match.

**Blocked by:** 01: Enums and Core User & Game Tables

**Status:** resolved

## Acceptance criteria
- [x] PostgreSQL enum `friend_status_enum` (`pending`, `accepted`, `rejected`) defined.
- [x] `friends` table with `id`, `senderId` (foreign key to users), `receiverId` (foreign key to users), `status` (enum, default 'pending'), `createdAt`, and `updatedAt`.
- [x] Unique composite constraint on `(sender_id, receiver_id)` to disallow duplicate friend requests.
- [x] Check constraint or rule ensuring `sender_id != receiver_id`.
- [x] `ratings` table with `id`, `userId` foreign key, `gameId` foreign key, `ratingBefore` (double precision), `ratingAfter` (double precision), `ratingChange` (double precision), and `createdAt`.
- [x] Index on `(user_id, created_at)` for historical Elo rating curve lookups.
