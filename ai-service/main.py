"""
ai-service - Sprint 1 Skeleton
-----------------------------------------------------------------------------
FastAPI service providing AI-assisted incident recommendations.

Sprint 1 Scope:
  - GET  /health   -> Service liveness check
  - POST /suggest  -> Returns suggestions conforming strictly to the AI contract shape
                      in docs/plans/2026-10-08-sprint-1-implementation.md.

Rules enforced by contract:
  - AI only suggests; never mutates incident state or SLA (DR-10.2).
  - Every response is labelled with `aiGenerated: True` (FR-18.2).
  - Suggestions cite specific past incident IDs in `basedOn` derived from `pastIncidents`.
  - Backend records Accept/Reject; AI service returns suggestions without status or IDs.
"""

from __future__ import annotations

from typing import List
from fastapi import FastAPI
from pydantic import BaseModel, Field


app = FastAPI(
    title="Incident AI Service",
    description="Local AI suggestions for DevOps Incident Management System",
    version="0.1.0",
)


# ---------------------------------------------------------------------------
# AI Contract Models
# ---------------------------------------------------------------------------

class IncidentDetails(BaseModel):
    """Current incident payload sent by backend."""
    title: str = Field(
        ...,
        min_length=1,
        max_length=200,
        description="Title of the reported incident",
        examples=["Payment gateway timeout on checkout"],
    )
    description: str = Field(
        ...,
        min_length=1,
        max_length=5000,
        description="Incident details and error logs",
        examples=["High response times on /checkout, connection pool exhausted"],
    )
    service: str = Field(
        ...,
        description="Affected service name",
        examples=["Payments"],
    )
    severity: str = Field(
        ...,
        description="Incident severity level",
        examples=["SEV2"],
    )


class PastIncident(BaseModel):
    """Past incident retrieved as context (FR-17, FR-18)."""
    id: int = Field(
        ...,
        description="Numeric identifier of the past incident",
        examples=[12],
    )
    title: str = Field(
        ...,
        min_length=1,
        max_length=200,
        description="Title of the past incident",
        examples=["Database connection pool timeout on checkout service"],
    )
    description: str = Field(
        ...,
        min_length=1,
        max_length=5000,
        description="Details of the past incident",
        examples=["Checkout service returning 504 gateway timeouts under peak load"],
    )
    fix: str = Field(
        ...,
        min_length=1,
        max_length=5000,
        description="Resolution or troubleshooting fix that resolved the past incident",
        examples=["Increased HikariCP connection pool size and restarted pods"],
    )


class SuggestRequest(BaseModel):
    """Request payload adhering to the AI contract shape."""
    incident: IncidentDetails
    pastIncidents: List[PastIncident] = Field(
        default_factory=list,
        description="Relevant past incidents retrieved from database for context",
    )


class Suggestion(BaseModel):
    """Specific actionable suggestion proposed by AI (FR-18.1, FR-18.2)."""
    step: str = Field(
        ...,
        description="Recommended investigation or troubleshooting step",
        examples=["Check the payment gateway timeout"],
    )
    basedOn: List[int] = Field(
        ...,
        description="Past incident IDs this suggestion was derived from",
        examples=[[12]],
    )


class SuggestResponse(BaseModel):
    """Response payload adhering to the exact AI contract shape."""
    aiGenerated: bool = Field(
        True,
        description="Explicit marker that content is AI-generated (FR-18.2)",
    )
    suggestions: List[Suggestion] = Field(
        ...,
        description="Proposed investigation suggestions with citations",
    )


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/health")
def health() -> dict[str, str]:
    """Liveness check returning 200 OK so callers know the service is available."""
    return {
        "status": "ok",
        "service": "ai-service",
        "version": "0.1.0",
    }


@app.post("/suggest", response_model=SuggestResponse)
def suggest(request: SuggestRequest) -> SuggestResponse:
    """
    Returns recommendations based on incident details and past incident context.
    Conforms to the AI contract in docs/plans/2026-10-08-sprint-1-implementation.md.
    In Sprint 1, this returns suggestions referencing IDs from pastIncidents.
    (Real TF-IDF and Ollama LLM integration start in Sprint 2).
    """
    past_ids = [p.id for p in request.pastIncidents]

    if past_ids:
        # Generate suggestions citing IDs provided in pastIncidents
        suggestions = [
            Suggestion(
                step="Check the payment gateway timeout",
                basedOn=[past_ids[0]],
            )
        ]
        if len(past_ids) > 1:
            suggestions.append(
                Suggestion(
                    step="Restart stale worker processes and scale service replicas to shed connection backpressure",
                    basedOn=[past_ids[0], past_ids[1]],
                )
            )
    else:
        # Every suggestion must name its source (FR-18.2); return empty list when no past incidents are provided
        suggestions = []

    return SuggestResponse(
        aiGenerated=True,
        suggestions=suggestions,
    )
