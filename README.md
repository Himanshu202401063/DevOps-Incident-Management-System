# Incident Management System

IT314 course project, Group 2. A web application for reporting an incident, assigning a
responder, tracking the response, and recording the resolution.

The design documents in [docs/](docs/) are the specification. Read
[docs/PROJECT.md](docs/PROJECT.md) first.

## Status

Foundations and deployment are in place. Business features and login are next.

| Part | State |
| --- | --- |
| Repository, `.gitignore`, `.gitattributes` | Done |
| Backend: Spring Boot 4.1.1, Flyway, Testcontainers, error handling, Swagger/OpenAPI | Done |
| Frontend: Vite + React + TypeScript, Tailwind, TanStack Query, Vitest, Cypress | Done |
| PostgreSQL 16 in Docker Compose | Done |
| CI (build and test both applications), CodeQL, Dependabot | Done |
| Deployment: Vercel, Render, Supabase, UptimeRobot | Done |
| V1 migrations and seed data | Not started |
| Login and roles (FR-01) | Not started |

## Live

| What | URL |
| --- | --- |
| App | https://dev-ops-incident-management-system.vercel.app |
| Backend health | https://incident-backend-f340.onrender.com/actuator/health |
| API docs (Swagger UI) | https://incident-backend-f340.onrender.com/swagger-ui.html (opens once login is merged) |

## Requirements

| Tool | Version | Note |
| --- | --- | --- |
| JDK | 21 or newer | The build targets release 21; a newer JDK compiles against that level |
| Node | 24 | Matches CI |
| Docker | Any recent version | Needed for the database and the Testcontainers tests |

Maven is not required. Use the `mvnw` wrapper in `backend/`.

## Getting started

```bash
cp .env.example .env
docker compose up -d db       # PostgreSQL 16 on localhost:5433

cd backend && ./mvnw spring-boot:run    # http://localhost:8080
cd frontend && npm ci && npm run dev        # http://localhost:5173
```

The frontend dev server proxies `/api` to `http://localhost:8080`, so both run on their own
port without CORS configuration. API docs are at http://localhost:8080/swagger-ui.html.

Three things worth knowing before you change any setting:

- The database is on **5433**, not 5432. A locally installed PostgreSQL service usually owns
  5432 and would shadow the container, which shows up as a confusing password failure.
- `.env` is read by Docker Compose. The backend reads real environment variables, so if you
  change a default, export it too or use the `app` profile below. Leave the defaults alone and
  everything lines up on its own.
- PostgreSQL applies `POSTGRES_PASSWORD` only when it first initialises its data directory. If
  you change the password later, `docker compose down -v` to drop the volume and local data.
- Our tables live in the `incident` schema, not `public`. Look there in any database tool.

To run the packaged backend against the same database instead:

```bash
docker compose --profile app up --build
```

## Tests

```bash
cd backend  && ./mvnw verify          # JUnit + Testcontainers (Docker must be running)
cd backend  && ./mvnw test-compile org.pitest:pitest-maven:mutationCoverage   # on demand
cd frontend && npm test               # Vitest
cd frontend && npm run cypress:run    # end-to-end, needs both servers running
```

## Layout

| Path | Contents |
| --- | --- |
| `backend/` | Spring Boot application and Java tests |
| `backend/src/main/resources/db/migration/` | Flyway migrations |
| `frontend/` | React screens, components, and frontend tests |
| `frontend/vercel.json` | Vercel routing: `/api` to the Render backend, other paths to the app |
| `docs/` | Design documents, the requirements PDF, diagrams, and sprint notes |
| `.github/workflows/` | CI |
| `compose.yaml` | Local database and packaged application |
| `.env.example` | Example settings, no real credentials |

`ai-service/` is added only if the optional AI extension is started.

## Deployment

Merging to `main` deploys automatically once CI passes:

| Part | Host | Notes |
| --- | --- | --- |
| Frontend | Vercel | Every pull request also gets a preview link from the Vercel bot |
| Backend | Render (Docker, free tier) | Settings come from environment variables on Render: `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`, `JAVA_TOOL_OPTIONS`, `FLYWAY_LOCATIONS` |
| Database | Supabase (PostgreSQL) | Reached through the session pooler; tables in the `incident` schema |
| Uptime | UptimeRobot | Pings `/actuator/health` every 10 minutes, which also keeps Render's free tier awake |

Secrets live only in Render's environment variables, never in the repository.

## Working agreement

Branch from `main`, keep commits attributable to their author, open a focused pull request,
and have another member review it. CI must pass before merge. `AGENTS.md` holds the
conventions that apply to both people and coding agents working in this repository.
