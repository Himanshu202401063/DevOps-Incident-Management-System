# AI/ML Roadmap

**Team:** Himanshu, Shlok, Bhakti, and Dhruva. Who builds each feature is assigned per sprint.

## Rules from our requirements

- AI only **suggests**. It never changes status, severity, assignment, or SLA (DR-10.2).
- Every suggestion is **labelled AI-generated** and names the incidents it used (FR-18.2).
- A person **accepts or rejects** each suggestion, and that choice is recorded (FR-19).
- The app **works when AI is down or slow**: timeout, then carry on without it (FR-18.4, NFR-12).
- Models run **locally through Ollama** (NFR-12.1). CI uses a stub, never a real model.
- No predictions about individual people (DR-07.2).

## Features

| # | Feature | Kind | Requirement |
| --- | --- | --- | --- |
| 1 | **Similar past incidents:** "this looks like INC-12, fixed by …" | ML: TF-IDF, then embeddings | FR-17, FR-18 |
| 2 | **Investigation suggestions** from the fixes of similar incidents, with Accept / Reject | LLM + retrieval | FR-18.1, FR-19 |
| 3 | **Duplicate warning** when someone reports an incident that looks like an open one. A warning only; it never merges | ML similarity | FR-02, D07 |
| 4 | **Severity suggestion** from the title and description, with a confidence; the person still chooses | Classic ML classifier | FR-04 |
| 5 | **Postmortem first draft** from the incident timeline, for a person to edit | LLM | FR-11.4 |

If time remains: smart search ("payment timeouts last week"), spike detection on the dashboard,
and drafts of customer updates (FR-21).

## By sprint

| Sprint | Himanshu (`ai-service`) | Shlok (backend) | Bhakti |
| --- | --- | --- | --- |
| 1 | Skeleton: FastAPI, `/health`, stub `/suggest`, pytest, CI job; Ollama locally | — | — |
| 2 | Similar-incident finder (TF-IDF); `/suggest` with Ollama, JSON-schema checked, timeout | — | 30–50 sample incidents with their fixes |
| 3 | Embeddings for similarity; compare against TF-IDF on the sample set | Backend client for `ai-service` (timeout, fallback); duplicate warning at incident creation | AI suggestions panel with Accept / Reject |
| 4 | Severity classifier trained on the sample set | Record accept/reject decisions; severity suggestion endpoint | Severity hint in the create-incident form |
| 5 | Postmortem draft from the timeline | Postmortem draft endpoint | "Generate draft" button in the postmortem editor |

## How we measure it

- Similar incidents: precision@3 on the sample set (are the top 3 matches really related?).
- Severity classifier: accuracy and macro-F1 on a held-out part of the sample set.
- Suggestions and drafts: a small checklist per output (cites real incidents, no invented ids, valid JSON).

## Running it

`ai-service` runs locally next to the backend. The deployed app on Render has no AI: with
`AI_SERVICE_URL` unset, the backend skips the AI calls and the screens hide the AI panels. That is
also how we show "works when AI is down".
