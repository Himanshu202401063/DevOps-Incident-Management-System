# Sprint 1 Implementation Plan

**Goal:** a logged-in user can register a service and create an incident for it, and every change
is recorded. Stories: US-01 Users and roles, US-05 Register a service, US-03 Create incident
([user-stories.md](../user-stories.md)).

This plan says what to build and how to check it. Each member writes and commits their own code.

## Decisions

Record these in the `PROJECT.md` decision log before coding.

| Topic | Decision |
| --- | --- |
| Roles | `ADMIN`, `ENGINEER`, `VIEWER` |
| Login | Stateless JWT, sent as `Authorization: Bearer <token>`, stored in `sessionStorage`. No server session, so CSRF is disabled |
| Logout and role changes | Each user has a `token_version` carried in the token. Logout or a role change increments it, so old tokens stop working at once |
| Creating an incident | Incident, copied SLA targets, timeline entry, and audit entry are saved in **one transaction** |
| Service criticality | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` |
| Default response targets | SEV1 15 min, SEV2 60 min, SEV3 240 min, SEV4 1440 min. Resolution targets have no default |
| Who manages services and users | Admin only |

**Not in Sprint 1:** on-call, alerts, escalation, notifications, status changes, RabbitMQ, Redis, AI.

## Team

| Track | Members |
| --- | --- |
| Backend | Shane, Shlok, Himanshu, Utsav B |
| Frontend | Bhakti, Manan, Dhruva |
| Testing | Utsav D, Het, Manush |
| DevOps | Shane |

Whoever builds a feature writes its unit and integration tests in the same PR. The Testing track
owns the tests that span features.

## Order of work

1. **Shlok** merges the database migrations first. Everyone builds on these tables.
2. **Shane** merges login next. Integration tests that need a token wait for it.
3. **Himanshu** merges the `Severity` enum early (Utsav B needs it). **Bhakti** merges the API client early (Manan and Dhruva need it).
4. Everything else runs in parallel against the [API contract](#api-contract).
5. **Shane** adds Compose and the CI end-to-end job once the features are in.

## Work per member

**Shane** — Backend and DevOps
- Backend foundations: resource-server starter, `Clock` bean, error handler, `@IntegrationTest` test setup, Swagger/OpenAPI
- JWT login: `/api/auth/login`, `/me`, `/logout`, token-version check. Test: `AuthControllerTest`
- Compose `web` service and `JWT_SECRET`; CI end-to-end job

**Shlok** — Backend
- Database migrations V1–V3 and the dev seed
- Audit writer (`AuditService`)
- User administration: create user, list users, change role. Test: `UserAdminControllerTest`

**Himanshu** — Backend
- `Severity` enum (merge first)
- Service catalog: create, update, list, with SLA targets and audit entries. Test: `ServiceControllerTest`

**Utsav B** — Backend
- Incidents: create, list, detail, with timeline and audit in one transaction
- Tests: `IncidentTest` (unit), `IncidentControllerTest`, `IncidentCreationRollbackTest`

**Bhakti** — Frontend
- API client and Zod schemas (merge first)
- Login page, app layout, routing, role-based navigation
- Users page

**Manan** — Frontend
- Services list and the create/edit form with the SLA target grid

**Dhruva** — Frontend
- Incident list and the create-incident form

**Utsav D** — Testing
- `SecurityMatrixTest`: every endpoint × Admin, Engineer, Viewer, and no token

**Het** — Testing
- Cypress test that runs the Sprint 1 demo end to end

**Manush** — Testing
- `DatabaseSchemaTest` (in Shlok's migration PR)
- Manual run of the demo in Chrome and Firefox
- Update `TRACEABILITY.csv` with the real test names; draft the sprint record

---

## API contract

### Permissions

| Endpoint | Admin | Engineer | Viewer | No token |
| --- | --- | --- | --- | --- |
| `POST /api/auth/login` | ✓ | ✓ | ✓ | ✓ |
| `GET /api/auth/me`, `POST /api/auth/logout` | ✓ | ✓ | ✓ | 401 |
| `GET/POST /api/users`, `PUT /api/users/{id}/role` | ✓ | 403 | 403 | 401 |
| `GET /api/services`, `GET /api/services/{id}` | ✓ | ✓ | ✓ | 401 |
| `POST /api/services`, `PUT /api/services/{id}` | ✓ | 403 | 403 | 401 |
| `GET /api/incidents`, `GET /api/incidents/{id}` | ✓ | ✓ | ✓ | 401 |
| `POST /api/incidents` | ✓ | ✓ | 403 | 401 |

### Request and response shapes

```jsonc
// POST /api/auth/login → 200
{ "username": "admin", "password": "…" }
{ "token": "eyJ…", "expiresAt": "…",
  "user": { "id": 1, "username": "admin", "displayName": "Dev Admin", "role": "ADMIN" } }

// POST /api/users → 201
{ "username": "asha", "displayName": "Asha", "password": "8 to 72 chars", "role": "ENGINEER" }

// PUT /api/users/{id}/role → 200
{ "role": "ADMIN" }

// POST /api/services → 201, PUT /api/services/{id} → 200
{ "name": "Payments", "description": "…", "ownerId": 1, "criticality": "CRITICAL",
  "targets": { "SEV1": { "responseMinutes": 15,   "resolutionMinutes": 240 },
               "SEV2": { "responseMinutes": 60,   "resolutionMinutes": 480 },
               "SEV3": { "responseMinutes": 240,  "resolutionMinutes": 2880 },
               "SEV4": { "responseMinutes": 1440, "resolutionMinutes": 10080 } } }
// response adds "id" and returns "owner": { "id", "displayName" } instead of "ownerId"

// POST /api/incidents → 201
{ "title": "Checkout failing", "description": "…", "serviceId": 1, "severity": "SEV2" }
// response, also GET /api/incidents/{id}:
{ "id": 7, "reference": "INC-7", "title": "…", "description": "…",
  "service": { "id": 1, "name": "Payments" }, "severity": "SEV2", "status": "OPEN",
  "reporter": { "id": 2, "displayName": "Dev Engineer" }, "assignee": null, "createdAt": "…",
  "responseTargetMinutes": 60, "resolutionTargetMinutes": 480, "responseDueAt": "…", "resolutionDueAt": "…",
  "timeline": [ { "id": 3, "eventType": "INCIDENT_CREATED", "actor": "Dev Engineer",
                  "details": "Reported as SEV2 on Payments", "recordedAt": "…" } ] }

// GET /api/incidents → 200, newest first
[ { "id": 7, "reference": "INC-7", "title": "…", "serviceName": "Payments",
    "severity": "SEV2", "status": "OPEN", "createdAt": "…" } ]
```

Timestamps are ISO-8601 UTC.

### Errors

```json
{ "status": 400, "message": "Validation failed", "errors": { "title": "Title is required" } }
```

400 validation (`errors` names the field) · 401 no/expired/revoked token or wrong password ·
403 role not allowed · 404 unknown id · 409 duplicate username or service name.

---

## Database

Flyway migrations in `backend/src/main/resources/db/migration`. New migrations after these start at V4.

| Migration | Tables |
| --- | --- |
| `V1__users_and_audit.sql` | `app_user` (id, username unique, display_name, password_hash, role, enabled, token_version, created_at) · `audit_entry` (id, actor_id, action, item_type, item_id, details, recorded_at) |
| `V2__catalog.sql` | `service` (id, name unique, description, owner_id, criticality, created_at, updated_at) · `service_sla_target` (service_id, severity, response_minutes, resolution_minutes; PK service_id + severity; resolution ≥ response) |
| `V3__incidents_and_timeline.sql` | `incident` (id, title, description, service_id, severity, status, reporter_id, assignee_id nullable, created_at, response_target_minutes, resolution_target_minutes, version) · `timeline_entry` (id, incident_id, actor_id, event_type, details, recorded_at, corrects_entry_id nullable) |

- `audit_entry` and `timeline_entry` get a `BEFORE UPDATE OR DELETE` trigger that raises an error, so they are append-only.
- The table is `app_user` because `user` is reserved in PostgreSQL.
- Enums are `varchar` columns with a `CHECK` constraint. Timestamps are `timestamptz`.

**Dev seed** `db/devdata/R__dev_seed.sql` (idempotent, `ON CONFLICT DO NOTHING`): users `admin`,
`engineer`, `viewer`, all with password `DevPassw0rd!`, hash
`{bcrypt}$2a$10$VIfFAxI6UFgBeWMdFEvAp.16koHo8wb8LRuqky0e47iWLefM5Huwm`; and service `Payments`
with the targets above. Enable with
`spring.flyway.locations=${FLYWAY_LOCATIONS:classpath:db/migration,classpath:db/devdata}`;
production sets `FLYWAY_LOCATIONS=classpath:db/migration`.

---

## Backend

Packages under `com.group2.incident`: `common`, `auth`, `audit`, `catalog`, `incident`.
Controllers return DTO records, never entities.

**Foundations**
- Add `spring-boot-starter-security-oauth2-resource-server` and its `-test` starter. These are the Boot 4.1 names.
- `Clock` bean (`Clock.systemUTC()`). Code reading the time injects it.
- One error handler producing the error shape. **No catch-all `Exception` handler**: it would hide Spring Security's 403.
- API docs: `springdoc-openapi-starter-webmvc-ui` 3.1.1, with a Bearer JWT scheme so Swagger UI has an Authorize button. Swagger UI at `/swagger-ui.html`, spec at `/v3/api-docs`. **Every controller gets `@Tag` and every endpoint an `@Operation(summary = "…")`.**
- `@IntegrationTest` = `@SpringBootTest` + `@AutoConfigureMockMvc` + `@Import(TestcontainersConfiguration.class)` + `@Transactional`.
- Boot 4 test packages: `org.springframework.boot.webmvc.test.autoconfigure.*`, `org.springframework.boot.data.jpa.test.autoconfigure.*`.

**Login (JWT)**
- Key from the `JWT_SECRET` env var (base64, ≥ 32 bytes). If blank, generate a random key and log a warning.
- `NimbusJwtEncoder.withSecretKey(key).algorithm(MacAlgorithm.HS256).build()`; `NimbusJwtDecoder.withSecretKey(key).macAlgorithm(MacAlgorithm.HS256).build()`.
- Claims: `sub` = user id, `tv` = token version, `exp` = 1 hour. `tv` decodes as `Long`; compare with `intValue()`.
- On every request, a `Converter<Jwt, AbstractAuthenticationToken>` loads the user and checks `tv` and `enabled`; on mismatch it throws `InvalidBearerTokenException` (→ 401). The role comes from the database.
- Security config: CSRF off, `STATELESS`, `oauth2ResourceServer(jwt)`, URL rules from the permissions table, `/error`, `/actuator/health/**`, `/swagger-ui/**`, and `/v3/api-docs/**` open.
- Passwords: `DaoAuthenticationProvider` + `PasswordEncoderFactories.createDelegatingPasswordEncoder()`.

**Audit:** `AuditService.record(...)` uses `Propagation.MANDATORY`, so it always commits or rolls back with the change it records.

**Catalog:** targets map as `@ElementCollection Map<Severity, SlaTarget>` with `@MapKeyEnumerated(STRING)`. All four severities required. Create and update write an audit entry; updates show before → after.

**Incidents:** `IncidentService.create` is one `@Transactional` method: load service → save incident (OPEN, reporter from the token, targets copied) → timeline entry → audit entry. `IncidentCreationRollbackTest` makes `AuditService` throw (`@MockitoBean`) and checks no incident or timeline row was saved.

---

## Frontend

Files in `frontend/src/`: `api/` (client, schemas), `auth/` (token store, context, route guard),
`components/Layout.tsx`, `pages/` (Login, Users, ServiceList, ServiceForm, IncidentList, IncidentCreate),
`router.tsx`.

- The API client adds the Bearer token, validates responses with Zod, and on 401 clears the token and returns to `/login`.
- Navigation hides what the role can't use: Viewer sees no "New incident"; only Admin sees Services edit and Users.
- Every form input has an `id` equal to its field name (Cypress uses them).
- Watch out for: `import type` for type-only imports; no TypeScript `enum`; Zod 4 messages use `{ error: '…' }`.

---

## Testing

- **Security matrix** (`SecurityMatrixTest`): every row of the permissions table, as all four callers, asserting the exact status.
- **Cypress demo** (`frontend/cypress/e2e/sprint-1-demo.cy.ts`):
  1. Admin logs in and creates an Engineer.
  2. Admin registers a service with targets.
  3. The Engineer logs in and creates a SEV2 incident.
  4. The incident appears in the list with `INC-` and OPEN.
  5. An empty incident form shows field errors.
  6. The Viewer sees no "New incident" link and is refused at `/incidents/new`.
- **Manual:** run the demo in Chrome and Firefox; record the browser versions.
- **Traceability:** put real test names in `TRACEABILITY.csv`; mark Passed only after a run, with date and commit.

---

## DevOps

- `vite.config.ts`: add a `preview` proxy for `/api`, same as `server`.
- `compose.yaml`: `JWT_SECRET` on `app`; a `web` service from `./frontend` on port 8081 (profile `app`).
- `.env.example`: `JWT_SECRET=` (generate with `openssl rand -base64 32`).
- CI: an `e2e` job with a `postgres:16` service, the backend jar started in the background, and `cypress-io/github-action` running against `vite preview`.

---

## Definition of Done

1. Reviewed and merged into `main` through a pull request
2. Each acceptance criterion in scope has at least one automated test
3. CI passes
4. It works in the Docker Compose setup
5. It is shown in the sprint demo

**Before your first commit:** check that `git config user.email` is an address verified on your
GitHub account, or your commits won't be credited to you.
