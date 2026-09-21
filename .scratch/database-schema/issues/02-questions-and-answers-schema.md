# 02: Question Generation and Answer Submission Tables

**What to build:**  
Arithmetic question engine and player submission models. Defines the `math_operator_enum` (`+`, `-`, `*`, `/`), the `questions` table for storing generated math problems per game with pre-computed solutions and ordering, and the `question_answers` table for recording player answer attempts, correctness, and response latency.

**Blocked by:** 01: Enums and Core User & Game Tables

**Status:** resolved

## Acceptance criteria
- [x] PostgreSQL enum `math_operator_enum` (`+`, `-`, `*`, `/`) defined.
- [x] `questions` table with `id`, `gameId` foreign key (cascade delete), `operand1`, `operand2`, `operator` (enum), `correctAnswer`, `orderIndex`, and `createdAt`.
- [x] `question_answers` table with `id`, `gameId` foreign key, `questionId` foreign key, `userId` foreign key, `submittedAnswer`, `isCorrect` (boolean), `timeTakenMs` (nullable integer), and `answeredAt`.
- [x] Indexes on `(game_id, order_index)` on `questions` and `(game_id, question_id, user_id)` on `question_answers` for fast lookups.
