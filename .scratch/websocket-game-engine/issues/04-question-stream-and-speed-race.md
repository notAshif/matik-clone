# 04: Question Generator & Real-Time Speed Race Loop

**What to build:** Generate dynamic arithmetic questions matching database constraints, stream Question #1 on match start, validate player answers in real time, advance each player along their question stream independently, and broadcast live score updates to both opponents.

**Blocked by:** 03: Matchmaking Queue & Direct Challenge Invitations

**Status:** resolved

- [x] Implement arithmetic question generator producing operands and operators (`+`, `-`, `*`, `/`) with precomputed integer answers.
- [x] Send `START_GAME` with game metadata, opponent info, and public Question #1 (without `correctAnswer`).
- [x] Handle `SUBMIT_ANSWER`: compare submitted answer against precomputed answer, compute score deltas, and reply with `ANSWER_RESULT` carrying the next question.
- [x] Broadcast `SCORE_UPDATE` with live scores to both players after every submitted answer so players see live race progress.
