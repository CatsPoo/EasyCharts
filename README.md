# EasyCharts

> **Interactive network infrastructure diagram editor** — build, visualize, and collaborate on complex network topologies with a drag-and-drop canvas.

---

## What is EasyCharts?

EasyCharts is a full-stack web application for designing and managing network infrastructure diagrams. Place devices on a canvas, define ports, draw connections, annotate with overlays, and share charts across your team — all in a browser.

**Core capabilities:**

- **Visual editor** — drag-and-drop devices onto an interactive canvas, connect ports with bonds, annotate with notes and zones
- **Device catalog** — pre-defined device types with icons; attach images and model metadata
- **Chart versioning** — every save is recorded; browse and restore previous versions
- **Collaborative locking** — lock a chart while editing so teammates don't overwrite your work
- **Role-based access control** — `CHART_READ`, `CHART_WRITE`, and `USER_MANAGE` permissions per user
- **Organized directories** — hierarchical folder structure to keep charts tidy
- **Self-hosted** — runs entirely on your own infrastructure via Docker

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, React Flow, MUI, TailwindCSS, Vite |
| **Backend** | NestJS, TypeORM, Passport.js, JWT |
| **Database** | PostgreSQL 16 |
| **Shared types** | Zod schemas → TypeScript types |
| **Monorepo** | Nx |
| **Containerization** | Docker, Docker Compose |

---

## Getting Started

### Prerequisites

- **Docker & Docker Compose** — for the recommended production setup
- **Node.js 22+** and **npm** — for local development

---

### Option A — Docker Compose (Recommended)

The fastest way to run the full stack.

**1. Clone and configure**

```bash
git clone <repo-url>
cd EasyCharts
cp .env.example .env
```

**2. Edit `.env`** and set your secrets:

```ini
# Database
DB_USER=postgres
DB_PASS=your-strong-password
DB_NAME=EasyCharts

# JWT secrets — change these to long random strings!
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRE_IN=30m
REFRESH_JWT_SECRET=replace-with-a-different-long-random-secret
REFRESH_JWT_EXPIRE_IN=1d

# Default admin account created on first run
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_PASSWORD=change-me-in-production
```

**3. Start the stack**

```bash
docker-compose up -d
```

| Service | URL |
|---|---|
| Web UI | `http://localhost` |
| API | `http://localhost/api` |
| PostgreSQL | `localhost:5432` |

Log in with the admin credentials you set in `.env`.

**4. Stop**

```bash
docker-compose down
```

---

### Option B — Local Development

Run the frontend and backend in watch mode for hot reloading.

**1. Install dependencies**

```bash
npm install
```

**2. Start a PostgreSQL instance**

You can use the database from Docker Compose while running the apps locally:

```bash
docker-compose up -d db
```

**3. Start the backend**

```bash
npx nx serve @easy-charts/backend --configuration development
# Runs on http://localhost:3000
```

**4. Start the frontend** (in a second terminal)

```bash
npx nx serve @easy-charts/frontend
# Runs on http://localhost:4200
```

---

## Nx Commands

```bash
# Build all packages
npx nx run-many --all --target=build

# Build a single app
npx nx build @easy-charts/backend
npx nx build @easy-charts/frontend

# Run tests
npx nx test @easy-charts/backend
npx nx test @easy-charts/frontend

# Type check
npx nx typecheck

# Lint
npx nx lint

# Visualize the dependency graph
npx nx graph
```

---

## Project Structure

```
EasyCharts/
├── packages/
│   ├── apps/
│   │   ├── backend/           # NestJS API (port 3000)
│   │   │   └── src/
│   │   │       ├── auth/          # JWT + refresh token auth
│   │   │       ├── charts/        # Chart CRUD, locking, versioning
│   │   │       ├── chartsDirectories/
│   │   │       ├── devices/       # Device catalog & instances
│   │   │       ├── ports/
│   │   │       ├── lines/         # Bonds between ports
│   │   │       ├── overlayElements/
│   │   │       ├── models/
│   │   │       └── upload/        # Image asset service
│   │   │
│   │   └── frontend/          # React 19 SPA (port 4200 / 80)
│   │       └── src/
│   │           ├── pages/
│   │           │   ├── ChartsPage     # Dashboard
│   │           │   ├── LoginPage
│   │           │   └── UsersPage      # Admin panel
│   │           └── components/
│   │               ├── ChartEditor/   # React Flow canvas
│   │               ├── AssetsList/    # Device management
│   │               └── VersionHistory/
│   │
│   └── libs/
│       └── easycharts-types/  # Shared Zod schemas + TS types
│
├── docker-compose.yml
├── Dockerfile
└── .env.example
```

---

## Features Overview

### Chart Editor

The heart of EasyCharts — an interactive canvas powered by React Flow.

- Add devices from a searchable sidebar catalog
- Drag, resize, and arrange devices freely
- Connect device ports with labeled bond lines
- Add freeform notes and colored zone overlays
- Lock the chart to block concurrent edits while you work

### Device Catalog

Manage the library of devices available for use in charts.

- Create device types with custom icons and images
- Define port layouts (network interfaces) per device type
- Assign device model metadata

### Version History

Every chart save creates a snapshot.

- Browse the full version timeline
- Restore any previous version

### User Management

Admins can manage the user base from a dedicated panel.

- Create, edit, and deactivate users
- Assign per-user permissions: `CHART_READ`, `CHART_WRITE`, `USER_MANAGE`

---

## Authentication

- Login with username and password → receive a short-lived **JWT access token** and a **refresh token**
- Access tokens are refreshed automatically in the background
- Passwords are hashed with **bcrypt**; refresh tokens are stored as **bcrypt** hashes
