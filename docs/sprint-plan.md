# Sprint Plan

**Group 2** | DevOps Incident Management System

## 1. Sprint Roadmap (tentative)

Each sprint delivers something that works end to end. Sprint length: 2 weeks, adjusted to course deadlines.

| Sprint | Focus | Epics | User stories |
|---|---|---|---|
| **Sprint 1** | Foundation: log in, register a service, create an incident | E1, E2 (part) | US-01, US-05, US-03 |
| Sprint 2 | Alerts and on-call | E1, E2 | US-02, US-04, US-06 |
| Sprint 3 | Incident response | E3 | US-07, US-08, US-09, US-10 |
| Sprint 4 | Tracking and records | E4 | US-11, US-12, US-17 |
| Sprint 5 | Resolution and insights | E5, E6 | US-13, US-14, US-15, US-16 |
| Sprint 6 | Extensions (if time allows) | E6, E7 | US-18, US-19, US-20 |

## 2. Current sprint

**Sprint 1.** Its goal, decisions, API contract, and work items are in the
[Sprint 1 plan](plans/2026-10-08-sprint-1-implementation.md). Each sprint gets its own plan in
[plans/](plans/).

## 3. Sprint records

Write one record at the end of each sprint, using real PR links and test results only.

| Field | Content |
|---|---|
| Goal and dates | |
| Stories and owners | |
| Completed work | Links to merged PRs and the demo |
| Verification | Checks run and their results |
| Remaining work and blockers | |
| Review feedback and next improvement | |

### Sprint 1 (in progress)

| Field | Content |
|---|---|
| Goal and dates | A logged-in user can register a service and create an incident. Started 8 October 2026; end date to be set |
| Stories | US-01 Users and roles, US-05 Register a service, US-03 Create incident |
| Completed work | Backend foundations #13, own schema #14, migrations and dev seed #18, JWT login #22, AI service skeleton #21, shared UI components #19 and #39, API client #41, backend layout and Lombok #44 |
| Verification | CI on `main`: backend 94 tests (JUnit and Testcontainers), frontend 19 Vitest tests, AI service 11 pytest tests, all passing |
| Remaining work and blockers | User administration and audit writer; service catalog and incidents (#43 needs rework); frontend foundation and pages; `SecurityMatrixTest`; the Cypress demo |
| Review feedback | Several PRs arrived off-plan or did not compile (#27, #43), and some commits were credited to the wrong author. Next: one issue per task with acceptance criteria, and test output in every PR |
