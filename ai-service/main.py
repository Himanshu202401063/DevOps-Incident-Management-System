"""
ai-service - Sprint 1 (health, suggest) + Sprint 2 (Ollama embeddings)
-----------------------------------------------------------------------------
FastAPI service providing AI-assisted incident recommendations.

Sprint 1 Scope:
  - GET  /health   -> Service liveness check
  - POST /suggest  -> Returns suggestions conforming strictly to the AI contract shape
                      in docs/plans/2026-10-17-implementation-plan.md.

Sprint 2 additions (Issue #62):
  - POST /embed    -> Returns a numeric embedding vector via Ollama.
  - GET  /health   -> Now also reports whether Ollama is reachable.

Rules enforced by contract:
  - AI only suggests; never mutates incident state or SLA (DR-10.2).
  - Every response is labelled with `aiGenerated: True` (FR-18.2).
  - Suggestions cite specific past incident IDs in `basedOn` derived from `pastIncidents`.
  - Backend records Accept/Reject; AI service returns suggestions without status or IDs.
  - The app keeps working when Ollama is down or slow (FR-18.4, NFR-12).

Environment variables (Sprint 2):
  - OLLAMA_URL         : Base URL of the Ollama server  (default: http://localhost:11434)
  - OLLAMA_EMBED_MODEL : Embedding model name           (default: nomic-embed-text)
  - OLLAMA_TIMEOUT     : Request timeout in seconds     (default: 10)
"""

from __future__ import annotations

import logging
import os
from typing import List

import httpx
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

logger = logging.getLogger("ai-service")

def get_ollama_url() -> str:
    return os.getenv("OLLAMA_URL", "http://localhost:11434").rstrip("/")


def get_ollama_model() -> str:
    return os.getenv("OLLAMA_EMBED_MODEL", "nomic-embed-text")


def get_ollama_timeout() -> float:
    try:
        return float(os.getenv("OLLAMA_TIMEOUT", "10"))
    except ValueError:
        return 10.0


# Module-level defaults for backward compatibility / inspection
OLLAMA_URL: str = get_ollama_url()
OLLAMA_EMBED_MODEL: str = get_ollama_model()
OLLAMA_TIMEOUT: float = get_ollama_timeout()

_VERSION = "0.2.0"

app = FastAPI(
    title="Incident AI Service",
    description="Local AI suggestions for DevOps Incident Management System",
    version=_VERSION,
)


# ---------------------------------------------------------------------------
# AI Contract Models (Sprint 1 — unchanged)
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
# Embed Models (Sprint 2 — Issue #62)
# ---------------------------------------------------------------------------

class EmbedRequest(BaseModel):
    """Request payload for the /embed endpoint."""
    text: str = Field(
        ...,
        min_length=1,
        max_length=32000,
        description="Text to embed",
        examples=["Payment gateway timeout on checkout"],
    )


class EmbedResponse(BaseModel):
    """Response payload for the /embed endpoint."""
    embedding: List[float] = Field(
        ...,
        description="Numeric embedding vector produced by the configured model",
    )
    model: str = Field(
        ...,
        description="Name of the embedding model that produced this vector",
    )


# ---------------------------------------------------------------------------
# Internal helpers — Ollama HTTP interaction
# ---------------------------------------------------------------------------

def _send_ollama_request(
    method: str,
    path: str,
    json: dict | None = None,
    timeout: float = 10.0,
) -> httpx.Response:
    """
    Execute an HTTP request to Ollama.
    Isolated into a single function to make testing and error handling clean.
    """
    url = f"{get_ollama_url()}{path}"
    with httpx.Client(timeout=timeout) as client:
        if method.upper() == "GET":
            return client.get(url)
        return client.post(url, json=json)


def _ollama_reachable() -> bool:
    """
    Probe Ollama with a short timeout. Returns True only when Ollama responds
    with HTTP 200. Never raises; always returns a bool (NFR-12).
    """
    try:
        resp = _send_ollama_request("GET", "/api/tags", timeout=3.0)
        return resp.status_code == 200
    except Exception:
        return False


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/health")
def health() -> dict:
    """
    Liveness check.

    Sprint 1 contract (preserved):
      { "status": "ok", "service": "ai-service", "version": "…" }

    Sprint 2 additions:
      "ollama": { "reachable": true|false, "url": "…", "model": "…" }

    The service always returns HTTP 200 — it remains useful even when Ollama
    is unavailable (FR-18.4, NFR-12).
    """
    url = get_ollama_url()
    model = get_ollama_model()
    ollama_reachable = _ollama_reachable()
    return {
        "status": "ok",
        "service": "ai-service",
        "version": _VERSION,
        "ollama": {
            "reachable": ollama_reachable,
            "url": url,
            "model": model,
        },
    }


@app.post("/suggest", response_model=SuggestResponse)
def suggest(request: SuggestRequest) -> SuggestResponse:
    """
    Returns recommendations based on incident details and past incident context.
    Conforms to the AI contract in docs/plans/2026-10-17-implementation-plan.md.
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


@app.post("/embed", response_model=EmbedResponse)
def embed(request: EmbedRequest) -> EmbedResponse:
    """
    Returns a numeric embedding vector for the supplied text via Ollama.

    Uses the model configured in OLLAMA_EMBED_MODEL (default: nomic-embed-text).
    The same text and model always produce the same vector when the underlying
    model and configuration are unchanged.

    Error responses:
      - 422  if the request body is missing or invalid (FastAPI validation).
      - 503  if Ollama is unreachable or times out.
      - 502  if Ollama returns an unexpected response shape.
    """
    url = get_ollama_url()
    model = get_ollama_model()
    timeout = get_ollama_timeout()

    payload = {
        "model": model,
        "input": request.text,
    }

    try:
        resp = _send_ollama_request("POST", "/api/embed", json=payload, timeout=timeout)
    except httpx.TimeoutException:
        logger.warning("Ollama request timed out (url=%s, model=%s)", url, model)
        raise HTTPException(
            status_code=503,
            detail="Ollama request timed out. Make sure Ollama is running and the model is pulled.",
        )
    except httpx.RequestError as exc:
        logger.warning("Ollama connection error: %s", exc)
        raise HTTPException(
            status_code=503,
            detail=f"Cannot reach Ollama at {url}. Make sure Ollama is running.",
        )

    if resp.status_code != 200:
        logger.error("Ollama returned HTTP %s: %s", resp.status_code, resp.text[:200])
        raise HTTPException(
            status_code=502,
            detail=f"Ollama returned an unexpected status: {resp.status_code}",
        )

    try:
        body = resp.json()
        # Newer Ollama returns: { "embeddings": [[...]] }
        # Older Ollama returns: { "embedding": [...] }
        if "embeddings" in body and isinstance(body["embeddings"], list) and len(body["embeddings"]) > 0:
            vector: List[float] = body["embeddings"][0]
        elif "embedding" in body and isinstance(body["embedding"], list):
            vector = body["embedding"]
        else:
            raise ValueError("Missing or malformed embeddings field in Ollama response")

        if not vector or not all(isinstance(x, (int, float)) for x in vector):
            raise ValueError("Embedding vector contains non-numeric values or is empty")
    except (ValueError, KeyError, TypeError) as exc:
        logger.error("Unexpected Ollama response shape: %s", exc)
        raise HTTPException(
            status_code=502,
            detail="Ollama returned an unexpected response shape.",
        )

    return EmbedResponse(embedding=vector, model=model)

