# 01: Backend Fixes, Client Routing & Auth Pages

**What to build:** Fix Express backend routing and auth middleware, install and configure `react-router-dom` in the frontend, and build polished, dark-mode Login and Registration pages with form validation and JWT session persistence.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] Fix `apps/backend/index.ts` to use `app.use(cors())` and `app.use("/api/v1/auth", AuthRoute)`.
- [x] Fix `apps/backend/middleware/middleware.ts` token extraction and `req.userId` assignment.
- [x] Install `react-router-dom` in `@repo/frontend` and configure BrowserRouter with routes (`/login`, `/register`, `/`, `/game`).
- [x] Create `AuthContext` to persist JWT in `localStorage` and provide `login`, `register`, and `logout` helpers.
- [x] Build beautiful Login and Registration screens with email/password validation, loading states, and error handling.
