# Sprint Plan

**Group 2** | DevOps Incident Management System

## 1. Sprint roadmap

Each sprint is about 2 weeks and delivers working features end to end: API, UI, tests, and
docs. The features are described in [FEATURES.md](FEATURES.md), and the AI work in the
[AI/ML roadmap](plans/ai-ml-roadmap.md). If a sprint runs late, the items in the last column go
first.

| Sprint | Must ship | Stories | Cut first if late |
|---|---|---|---|
| **1** | Users and roles, service catalog with SLA targets, incidents (create, list, detail). Frontend foundation, then the login, shell, home, incidents, services, and users screens | US-01, US-05, US-03 | Home widgets beyond open incidents |
| 2 | Alert intake and deduplication, tool tokens, on-call, notifications. Uptime monitors from one region, heartbeats. Demo shop v1 sending logs and metrics to Grafana Cloud | US-02, US-04, US-06 | Keyword and SSL monitor types |
| 3 | Acknowledge, status and severity changes, assignment, incident roles, escalation (outbox and RabbitMQ), comments and corrections. Checks from several regions. Grafana alerts into our intake | US-07, US-08, US-09, US-10, US-11 | A third probe region |
| 4 | Logs explorer, metrics dashboards, service map (links entered by hand), runbooks, deploy tracking, public status page, history search. AI-1 Find similar; MCP read tools | US-12, US-15, US-17, US-19, US-20 | Log patterns and saved views |
| 5 | Postmortems, follow-ups, insights. AI-2 AI SRE, AI-3 Drafting, AI-4 Triage hint; MCP write tools | US-13, US-14, US-16, US-18 | Service map links derived from traces |
| 6 | Hardening: the Cypress end-to-end test, accessibility, performance, the demo script, AI evaluation runs, and buffer time | — | — |

The monitoring, telemetry, service map, runbook, and MCP features still need user stories and
requirements. Write them before the sprint that builds them.

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
