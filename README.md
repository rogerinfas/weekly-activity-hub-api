# Weekly Activity Hub — API

REST API for the **Weekly Activity Hub** task management application. Built with [NestJS](https://nestjs.com/) and [Prisma](https://www.prisma.io/) on top of PostgreSQL.

## Stack

| Layer | Technology |
|---|---|
| Framework | NestJS 11 |
| ORM | Prisma 6 |
| Database | PostgreSQL |
| Validation | class-validator + class-transformer |
| Language | TypeScript 5 |

## Prerequisites

- Node.js ≥ 20
- pnpm ≥ 9
- PostgreSQL instance (local or remote)

## Environment variables

Create a `.env` file at the project root:

```env
# PostgreSQL connection string
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE"

# Optional — defaults to 7000
PORT=7000
```

## Setup

```bash
# Install dependencies
pnpm install

# Apply database migrations
pnpm prisma migrate deploy

# Generate Prisma client
pnpm prisma generate
```

## Running the server

```bash
# Development (watch mode)
pnpm start:dev

# Production
pnpm start:prod
```

The API runs on **http://localhost:7000** by default.

## API reference

All endpoints are prefixed with `/tasks`.

| Method | Path | Description |
|---|---|---|
| `GET` | `/tasks` | List all tasks ordered by `order` asc |
| `POST` | `/tasks` | Create a new task |
| `GET` | `/tasks/:id` | Get a single task |
| `PATCH` | `/tasks/:id` | Update a task (partial) |
| `DELETE` | `/tasks/:id` | Delete a task |

### Task fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | `string` | ✅ | |
| `status` | `"backlog" \| "en-progreso" \| "completado"` | ✅ | |
| `project` | `"desarrollo" \| "diseño" \| "marketing" \| "personal" \| "otro"` | ✅ | |
| `description` | `string` | — | |
| `date` | `ISO date string` | — | Start / due date |
| `order` | `number` | — | Column position, defaults to `0` |

> **Note:** `completedAt` and `createdAt` are managed automatically by the server. Any value sent by the client for these fields is ignored.

### Example — create a task

```http
POST /tasks
Content-Type: application/json

{
  "title": "Design landing page",
  "status": "backlog",
  "project": "diseño"
}
```

### Example — move to completed

```http
PATCH /tasks/abc-123
Content-Type: application/json

{
  "status": "completado"
}
```

## Tests

```bash
# Unit tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:cov

# End-to-end
pnpm test:e2e
```

## Database migrations

```bash
# Create a new migration after editing prisma/schema.prisma
pnpm prisma migrate dev --name <migration-name>

# Apply migrations in production
pnpm prisma migrate deploy

# Open Prisma Studio
pnpm prisma studio
```

## Project structure

```
src/
├── app.module.ts          # Root module
├── main.ts                # Bootstrap (CORS, ValidationPipe, port)
├── prisma/
│   ├── prisma.module.ts
│   └── prisma.service.ts
└── tasks/
    ├── dto/
    │   ├── create-task.dto.ts
    │   └── update-task.dto.ts
    ├── tasks.controller.ts
    ├── tasks.module.ts
    └── tasks.service.ts
prisma/
├── schema.prisma
└── migrations/
```
