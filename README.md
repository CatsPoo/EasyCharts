# EasyCharts

A collaborative web application for creating and managing interactive network / infrastructure diagrams. Users can build charts with devices, connections, and overlay elements, share them with teammates, and track changes through version history.

---

## Main Target

EasyCharts aims to provide a simple, intuitive interface for visualizing and documenting network topologies and infrastructure layouts — replacing static diagrams with live, shareable, and versioned charts.

---

## Main Features

- **Interactive chart editor** — drag-and-drop devices, draw connections (lines/cables), and add overlay elements (zones, notes)
- **Device & port management** — define reusable device types and place them on charts with connection ports
- **Chart sharing & permissions** — share charts with specific users; role-based access control (view / edit)
- **Chart version history** — track and review changes over time
- **Directory organization** — organize charts into folders, with per-directory sharing
- **Concurrent edit locking** — prevents conflicting edits with a per-chart lock system
- **User authentication** — JWT-based login with refresh token rotation
- **Default admin account** — auto-created on first boot from environment config
- **Single-container deployment** — backend serves the React frontend as static files

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, React Flow, MUI, TailwindCSS, TanStack Query |
| Backend | NestJS 11, TypeORM, PostgreSQL 16 |
| Shared Types | Zod schemas (`packages/libs/easycharts-types`) |
| Monorepo | Nx |
| Containerization | Docker / Docker Compose |

---

## Project Structure

```
EasyCharts/
├── packages/
│   ├── apps/
│   │   ├── backend/          # NestJS API (port 3000)
│   │   └── frontend/         # React + Vite app (port 4200 in dev)
│   └── libs/
│       └── easycharts-types/ # Shared Zod schemas & TypeScript types
├── docker-compose.yml
├── Dockerfile
└── .woodpecker.yml           # CI/CD pipeline
```

---

## Setup

### Option 1 — Docker Compose (recommended)

1. Copy the environment file and fill in your values:
   ```bash
   cp "packages/apps/backend/.env example" .env
   ```

2. Start the full stack:
   ```bash
   docker-compose up -d
   ```

The app will be available at `http://localhost:3000`.
The database schema is created automatically on first boot.

---

### Option 2 — Local Development

**Prerequisites**: Node.js 22+, PostgreSQL 16, npm

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `packages/apps/backend/.env` from the example file and configure your DB connection.

3. Start the backend (port 3000):
   ```bash
   npx nx serve @easy-charts/backend
   ```

4. Start the frontend (port 4200, proxies `/api` to backend):
   ```bash
   npx nx serve @easy-charts/frontend
   ```

---

## Environment Variables

Create a `.env` file based on `packages/apps/backend/.env example`.

```env
# ── Database ──────────────────────────────────────────────
DB_HOST=localhost          # PostgreSQL host (use service name in Docker, e.g. "postgres")
DB_PORT=5432
DB_USER=postgres
DB_PASS=postgres
DB_NAME=EasyCharts

# ── Default Admin (created automatically on first boot) ───
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_PASSWORD=admin        # Change in production!

# ── JWT Access Token ──────────────────────────────────────
JWT_SECRET=JWTKEY                   # Change to a long random string in production!
JWT_EXPIRE_IN=30m

# ── JWT Refresh Token ─────────────────────────────────────
REFRESH_JWT_SECRET=JWTREFRESHKEY    # Change to a different long random string in production!
REFRESH_JWT_EXPIRE_IN=1d

# ── Logging ───────────────────────────────────────────────
# Severity order (low → high): verbose < debug < log < warn < error < fatal
# verbose → all messages, fatal → critical only
LOG_LEVEL=log
```

> **Security**: Always use strong, unique values for `JWT_SECRET`, `REFRESH_JWT_SECRET`, and `DEFAULT_ADMIN_PASSWORD` in any non-local environment.

---

## Available Scripts

```bash
# Serve backend in dev mode (with hot reload)
npx nx serve @easy-charts/backend

# Serve frontend in dev mode
npx nx serve @easy-charts/frontend

# Build all packages for production
npx nx run-many --all --target=build

# Run tests
npx nx run-many --all --target=test

# Lint
npx nx run-many --all --target=lint
```
