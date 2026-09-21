# 04: Drizzle ORM Relations, Indexing, and Type Inference Exports

**What to build:**  
Complete Drizzle ORM relational mappings and public TypeScript exports. Connects all tables via `relations()` for relational query capability (e.g. `db.query.games.findFirst({ with: { gameMembers: true, questions: true } })`), exports all TypeScript interfaces (`User`, `NewUser`, `Game`, `NewGame`, etc.), and exposes everything cleanly through `packages/database/index.ts`.

**Blocked by:** 02: Question Generation and Answer Submission Tables, 03: Social Friend System and Elo Ratings Tables

**Status:** resolved

## Acceptance criteria
- [x] `relations()` defined for `users`, `games`, `gameMembers`, `questions`, `questionAnswers`, `friends`, and `ratings`.
- [x] TypeScript types inferred using `InferSelectModel` and `InferInsertModel` for all tables.
- [x] `packages/database/src/schemas/schema.ts` cleanly exports all tables, enums, relations, and types.
- [x] `packages/database/index.ts` re-exports all schema entities and the `db` client instance.
- [x] TypeScript compilation and type-checking passes with 0 errors (`turbo run check-types` / `tsc --noEmit`).
