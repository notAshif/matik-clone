# ArithmeStrike ⚡

> **Real-Time 1v1 Speed Math Battle Arena**

ArithmeStrike is a competitive, real-time multiplayer arithmetic duel platform. Players compete head-to-head against opponents, solving algorithmic math problems under high-pressure countdown timers to score points, claim victory, and climb the global Elo leaderboard.

Built as a high-performance TypeScript monorepo powered by **Bun**, **Turborepo**, **React 19**, **Vite**, **Tailwind CSS v4**, **Express**, **WebSocket (`ws`)**, and **Drizzle ORM** with **PostgreSQL**.

---

## 📸 Highlights & Features

- **⚡ Real-Time Multiplayer Battles**: Sub-millisecond WebSocket communication for live question progression, score synchronization, and countdown timers.
- **🎯 Dynamic Matchmaking & Direct Duels**:
  - **Quick Match Queue**: Automated pool matchmaking pairing players ready for a duel.
  - **Direct Player Invites**: Challenge active online players directly from the live user bar with instant invitation toasts, acceptance flows, and automatic timeouts.
- **🏆 Production Elo Rating Engine**: Competitive matchmaking calculations with real-time rating updates (+/- delta) persisted atomically upon match completion.
- **🎨 Custom 2D Arcade Game UI**:
  - Handcrafted tactile arcade theme (`game-ui`) featuring responsive HUD, animated health/progress bars, floating score popups, and retro styled panels.
  - Pure zero-asset synthesized sound effects (`SoundFX`) generated client-side via the browser **Web Audio API**.
- **🔒 End-to-End Type Safety**: Shared Zod schemas, TypeScript contracts, and validated discriminated unions powering both client and server boundaries.
- **🛡️ Robust Match Persistence**: Resilient multi-question database persistence with automatic backfilling for rapid-answer sequences, transaction guarantees, and match history records.

---

## 🏛️ Monorepo Architecture

```
matik/
├── apps/
│   ├── frontend/         # React 19 + Vite + Tailwind CSS v4 single-page game client
│   ├── backend/          # Express 5 REST API (Auth, Profiles, Leaderboards, History)
│   └── websocket/        # Dedicated WebSocket server (Matchmaking, Lobbies, Game Loop)
│
├── packages/
│   ├── common/           # Shared Zod schemas, WebSocket event contracts, Elo logic
│   ├── database/         # Drizzle ORM schema, Postgres connection pool, and migrations
│   ├── ui/               # Shared cross-app UI primitives
│   ├── eslint-config/    # Shared ESLint configuration
│   └── typescript-config/# Shared tsconfig bases
│
└── scripts/
    └── dev.ts            # Unified dev runner with auto-Docker detection & auto-migrations
```

### Workspace Details

| Workspace | Technology | Responsibility |
| :--- | :--- | :--- |
| **`apps/frontend`** | React 19, Vite, Tailwind CSS v4 | Interactive game UI, HUD, authentication screens, profile stats, Web Audio effects |
| **`apps/backend`** | Express 5, JWT, bcrypt | User registration, login, profile statistics, ratings history, REST endpoints |
| **`apps/websocket`** | `ws`, TypeScript | Live connection manager, online presence, matchmaking queues, active match sessions |
| **`packages/common`** | Zod, TypeScript | Universal data contracts, message schemas, math generation rules, Elo algorithm |
| **`packages/database`** | Drizzle ORM, `pg` | Relational schema definitions, indexes, relations, migration scripts |

---

## 📡 WebSocket Protocol & Events

Communication between `apps/frontend` and `apps/websocket` is strictly typed through discriminated unions in `@repo/common`:

### Client Actions (`ClientAction`)

| Action Type | Payload Description | Purpose |
| :--- | :--- | :--- |
| `JOIN_QUEUE` | `{}` | Enters player into the automatic matchmaking queue |
| `LEAVE_QUEUE` | `{}` | Withdraws player from the matchmaking queue |
| `INVITE_PLAYER` | `{ targetUserId: number }` | Sends a direct match challenge to an online user |
| `ACCEPT_GAME` | `{ invitationId: string }` | Accepts a received direct match challenge |
| `DECLINE_GAME` | `{ invitationId: string }` | Declines a received direct match challenge |
| `CANCEL_INVITATION` | `{ invitationId?: string }` | Cancels an outgoing pending challenge |
| `SUBMIT_ANSWER` | `{ gameId, questionId, answer, timeTakenMs }` | Submits an answer to the current active question |

### Server Events (`ServerEvent`)

| Event Type | Payload | Description |
| :--- | :--- | :--- |
| `ONLINE_USERS` | `{ users: SafeUser[] }` | Broadcast of currently active users |
| `QUEUE_STATUS` | `{ status: "IDLE" \| "WAITING" \| "MATCHED" }` | Updates matchmaking queue status |
| `INVITATION` | `{ invitationId, status, sender, recipient, role }` | Direct challenge life-cycle notification |
| `START_GAME` | `{ gameId, timeLimit, opponent, firstQuestion }` | Signals game start and delivers initial question |
| `ANSWER_RESULT`| `{ questionId, isCorrect, correctAnswer, myScore, nextQuestion }` | Validates answer and serves next question |
| `SCORE_UPDATE` | `{ scores: Record<userId, score> }` | Broadcasts live scores to both opponents |
| `GAME_OVER` | `{ gameId, winnerId, scores, reason, ratings }` | Delivers match outcome and Elo delta updates |

---

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh/) (v1.2.0 or higher recommended)
- [Docker](https://www.docker.com/) (for local PostgreSQL container) or a running PostgreSQL instance

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/notAshif/matik-clone.git
cd matik
bun install
```

### 2. Environment Configuration

Create `.env` files for the workspaces that require environment variables:

**`packages/database/.env`**:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/matik
```

**`apps/backend/.env`**:
```env
PORT=8000
JWT_SECRET=your-super-secret-jwt-key
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/matik
CORS_ORIGIN=http://localhost:5173
```

**`apps/websocket/.env`**:
```env
PORT=4000
JWT_SECRET=your-super-secret-jwt-key
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/matik
```

### 3. Start PostgreSQL Database

If using Docker:

```bash
docker run --name matik-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=matik -p 5432:5432 -d postgres:16-alpine
```

### 4. Run Migrations

```bash
bun run db:migrate
```

### 5. Launch the Development Environment

Run the unified dev runner which automatically verifies Docker, applies any pending migrations, and starts all workspaces:

```bash
bun dev
```

The apps will be available at:
- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:8000](http://localhost:8000)
- **WebSocket Server**: `ws://localhost:4000`

---

## 🛠️ CLI & Package Scripts

From the root directory:

| Command | Action |
| :--- | :--- |
| `bun dev` | Runs the unified dev runner (auto-Docker start, DB migration check, all servers) |
| `bun run dev:turbo` | Runs Turborepo dev directly across all workspaces |
| `bun run build` | Builds all packages and applications via Turborepo |
| `bun run check-types`| Performs static type-checking across all packages (`tsc --noEmit` / `tsc -b`) |
| `bun run db:migrate` | Runs Drizzle migrations in `packages/database` |
| `bun run db:generate`| Generates new SQL migration files from Drizzle schema |
| `bun run db:push` | Pushes Drizzle schema directly to database |
| `bun run db:studio` | Opens Drizzle Studio GUI for inspecting database records |
| `bun run lint` | Runs ESLint across all projects |
| `bun run format` | Formats all files using Prettier |

You can also run target workspaces individually:
```bash
bun dev --frontend    # Runs only @repo/frontend
bun dev --backend     # Runs only @repo/backend
bun dev --websocket   # Runs only @repo/websocket
bun dev --skip-migrate# Starts servers bypassing DB migration check
```

---

## 🗄️ Database Schema

The database is structured into relational models managed by Drizzle ORM:

- **`users`**: Unique accounts with hashed passwords, usernames, and creation timestamps.
- **`games`**: Match session records, statuses (`waiting`, `in_progress`, `completed`, `abandoned`), time limits, and duration.
- **`game_members`**: Player participation links per match, scores, ranks, and victory flags.
- **`questions`**: In-game questions, operands, operators (`+`, `-`, `*`, `/`), and computed solutions.
- **`question_answers`**: Per-user submitted answers, accuracy booleans, response latency (`time_taken_ms`), and timestamps.
- **`user_ratings`**: Historical Elo rating ledger tracking `ratingBefore`, `ratingAfter`, and `ratingChange` per completed match.
- **`friends`**: Social relationships and invitations (`pending`, `accepted`, `rejected`).

---

## 🧪 Testing & Verification

Run tests and type checks across the monorepo:

```bash
# Verify static typing
bun run check-types

# Run unit tests (e.g. Elo rating engine)
bun test
```

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
