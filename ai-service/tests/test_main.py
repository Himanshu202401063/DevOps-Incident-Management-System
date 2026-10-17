"""
Tests for ai-service Sprint 1 skeleton.

Validates:
  - GET  /health returns 200 with status ok
  - POST /suggest returns 200 with the exact AI contract shape:
      - aiGenerated == True (FR-18.2)
      - suggestions contains step and basedOn
      - basedOn uses IDs strictly from pastIncidents (no hardcoded INC-12/INC-44)
      - no status or sug-001 ids in response
  - 422 validation on empty or exceeding min/max length for title and description
  - 422 on invalid/missing request payload
"""

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


# ---------------------------------------------------------------------------
# Health endpoint tests
# ---------------------------------------------------------------------------

def test_health_returns_200():
    response = client.get("/health")
    assert response.status_code == 200


def test_health_payload():
    response = client.get("/health")
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "ai-service"


# ---------------------------------------------------------------------------
# Suggest endpoint tests (Contract shape compliance)
# ---------------------------------------------------------------------------

def test_suggest_returns_200_and_exact_contract_shape():
    """Ensure response satisfies the AI contract in docs/plans/2026-10-17-implementation-plan.md."""
    payload = {
        "incident": {
            "title": "Payment gateway timeout",
            "description": "504 Gateway Timeout on checkout API under peak traffic",
            "service": "Payments",
            "severity": "SEV2",
        },
        "pastIncidents": [
            {
                "id": 12,
                "title": "Database connection pool timeout",
                "description": "Connection pool exhausted on checkout workers",
                "fix": "Increased HikariCP max pool size",
            }
        ],
    }
    response = client.post("/suggest", json=payload)
    assert response.status_code == 200
    data = response.json()

    # Contract: { "aiGenerated": true, "suggestions": [ { "step": "...", "basedOn": [12] } ] }
    assert data["aiGenerated"] is True
    assert isinstance(data["suggestions"], list)
    assert len(data["suggestions"]) > 0

    first_suggestion = data["suggestions"][0]
    assert first_suggestion["step"] == "Check the payment gateway timeout"
    assert first_suggestion["basedOn"] == [12]

    # Rule: Remove status and the sug-001 ids from the response
    assert "status" not in first_suggestion
    assert "id" not in first_suggestion
    assert "similar_incidents" not in data
    assert "confidence" not in data


def test_suggest_based_on_uses_provided_past_incident_ids():
    """Ensure basedOn strictly uses numeric IDs from pastIncidents."""
    payload = {
        "incident": {
            "title": "Orders failing with 500 internal server error",
            "description": "Downstream inventory service unreachable",
            "service": "Orders",
            "severity": "SEV1",
        },
        "pastIncidents": [
            {
                "id": 88,
                "title": "Inventory network partition",
                "description": "Circuit breaker did not trip",
                "fix": "Configured fallback circuit breaker",
            },
            {
                "id": 99,
                "title": "Deadlock in orders database",
                "description": "Concurrent lock contention on inventory table",
                "fix": "Reordered table updates in transaction",
            },
        ],
    }
    response = client.post("/suggest", json=payload)
    assert response.status_code == 200
    data = response.json()

    # Check that basedOn uses IDs from request pastIncidents
    assert data["suggestions"][0]["basedOn"] == [88]
    assert data["suggestions"][1]["basedOn"] == [88, 99]

    # Ensure no old hardcoded strings appear
    all_based_on = [
        item for s in data["suggestions"] for item in s["basedOn"]
    ]
    assert "INC-12" not in all_based_on
    assert "INC-44" not in all_based_on


def test_suggest_with_empty_past_incidents():
    """Handles empty pastIncidents by returning empty suggestions list since every suggestion must cite a source (FR-18.2)."""
    payload = {
        "incident": {
            "title": "New unknown anomaly",
            "description": "Service experiencing intermittent CPU spikes without known precedent",
            "service": "Analytics",
            "severity": "SEV3",
        },
        "pastIncidents": [],
    }
    response = client.post("/suggest", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["aiGenerated"] is True
    assert data["suggestions"] == []


# ---------------------------------------------------------------------------
# Validation tests (422 Unprocessable Entity)
# ---------------------------------------------------------------------------

def test_suggest_validation_error_on_missing_body():
    """Missing request body returns 422."""
    response = client.post("/suggest", json={})
    assert response.status_code == 422


def test_suggest_validation_error_on_empty_title():
    """Empty title violating min_length=1 returns 422."""
    payload = {
        "incident": {
            "title": "",
            "description": "Some description",
            "service": "Payments",
            "severity": "SEV2",
        }
    }
    response = client.post("/suggest", json=payload)
    assert response.status_code == 422


def test_suggest_validation_error_on_title_too_long():
    """Title exceeding max_length=200 returns 422."""
    payload = {
        "incident": {
            "title": "x" * 201,
            "description": "Some description",
            "service": "Payments",
            "severity": "SEV2",
        }
    }
    response = client.post("/suggest", json=payload)
    assert response.status_code == 422


def test_suggest_validation_error_on_empty_description():
    """Empty description violating min_length=1 returns 422."""
    payload = {
        "incident": {
            "title": "Valid title",
            "description": "",
            "service": "Payments",
            "severity": "SEV2",
        }
    }
    response = client.post("/suggest", json=payload)
    assert response.status_code == 422


def test_suggest_validation_error_on_description_too_long():
    """Description exceeding max_length=5000 returns 422."""
    payload = {
        "incident": {
            "title": "Valid title",
            "description": "x" * 5001,
            "service": "Payments",
            "severity": "SEV2",
        }
    }
    response = client.post("/suggest", json=payload)
    assert response.status_code == 422


def test_suggest_validation_error_on_missing_service():
    """Missing service field returns 422."""
    payload = {
        "incident": {
            "title": "Valid title",
            "description": "Valid description",
            "severity": "SEV2",
        }
    }
    response = client.post("/suggest", json=payload)
    assert response.status_code == 422
