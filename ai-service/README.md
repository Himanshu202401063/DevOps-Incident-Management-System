# AI Service (`ai-service`) — Sprint 1

**Team Member:** Himanshu (Lead, `ai-service`)  
**Project:** IT314 DevOps Incident Management System

---

## 1. Role & Sprint 1 Deliverables

| Deliverable | Status | Description |
|---|---|---|
| **`ai-service/` Skeleton** |  Completed | Python + FastAPI service with `GET /health` and `POST /suggest`. |
| **AI Contract Shape** |  Completed | `POST /suggest` matches the exact AI contract shape with citations derived from past incidents (FR-18.1, FR-18.2). |
| **Pytest Suite** |  Completed | 11 automated tests validating status codes, contract shape, dynamic citations, and payload validation (422). |
| **CI Workflow** |  Completed | GitHub Actions job (`.github/workflows/ci.yml`) running pytest using the stub (no heavy model in CI). |
| **Ollama Local Setup** |  Completed | Verified local Ollama daemon (`v0.40.3`); selected small model suited for local hardware. |

---

## 2. AI Contract & Requirements Mapping

The response from `POST /suggest` conforms strictly to the AI contract in `docs/plans/2026-10-17-implementation-plan.md`:

- **AI only suggests, never automates (DR-10.2):** Returns advisory investigation actions only; does not mutate incident status or SLA.
- **Labelled as AI-generated (FR-18.2):** `aiGenerated: true` explicitly included in root payload.
- **Cites past incidents (FR-18.2):** Each suggestion contains `basedOn: [12]` referencing numeric IDs supplied in `pastIncidents`.
- **Backend records decisions:** The AI service only suggests investigation steps; suggestion IDs and status are not returned as the backend records Accept/Reject choices.

### Contract Schema Example (`POST /suggest`)

**Request:**
```json
{
  "incident": {
    "title": "Payment gateway timeout",
    "description": "504 Gateway Timeout on checkout API under peak traffic",
    "service": "Payments",
    "severity": "SEV2"
  },
  "pastIncidents": [
    {
      "id": 12,
      "title": "Database connection pool timeout on checkout service",
      "description": "Increased traffic exhausted database pool workers",
      "fix": "Increased HikariCP max pool size from 20 to 50 and restarted checkout worker pods."
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "aiGenerated": true,
  "suggestions": [
    {
      "step": "Check the payment gateway timeout",
      "basedOn": [12]
    }
  ]
}
```

---

## 3. Ollama Model Selection & Memory Analysis

### System Specs Checked
- **Total RAM:** ~8.0 GB
- **Available Free RAM:** ~1.0 GB

### Model Evaluation

| Model | Parameters | Disk Download | Active RAM Needed | Assessment |
|---|---|---|---|---|
| **`qwen2.5:0.5b`** | 0.5 Billion | ~398 MB | **~0.8 – 1.0 GB** | **(Recommended)** Ultralightweight, fastest inference, fits within ~1 GB free RAM without freezing machine. |
| **`llama3.2:1b`** | 1.0 Billion | ~1.3 GB | **~1.5 – 1.8 GB** | Excellent JSON output capability; requires closing memory-heavy apps on 8 GB systems. |
| **`qwen2.5:1.5b`** | 1.5 Billion | ~986 MB | **~1.8 – 2.0 GB** | Strong reasoning, slightly higher memory overhead. |
| `llama3.2:3b` | 3.0 Billion | ~2.0 GB | ~3.0 – 3.5 GB | Too heavy for 8 GB system (causes swap/page file stutter). |
| `mistral:7b` / `llama3:8b` | 7–8 Billion | ~4.7 GB | ~5.5 – 6.0 GB | Unusable on 8 GB total RAM. |

### How to pull and run the recommended model:
```powershell
# 1. Pull the lightweight model (recommended for 8 GB RAM):
ollama run qwen2.5:0.5b

# Or if you have 2 GB+ free RAM:
ollama run llama3.2:1b
```

---

## 4. Running the Service & Tests Locally

### Quick Start
```powershell
# Install dependencies (use requirements-dev.txt to include pytest & httpx)
pip install -r requirements-dev.txt

# Start FastAPI server
python -m uvicorn main:app --reload --port 8000

# Run all pytest tests
python -m pytest -v
```

### Endpoints
- `GET http://localhost:8000/health` — Health check
- `POST http://localhost:8000/suggest` — AI suggestion endpoint
- `GET http://localhost:8000/docs` — Interactive Swagger documentation UI
