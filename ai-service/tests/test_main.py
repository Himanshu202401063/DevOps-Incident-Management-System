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


# ---------------------------------------------------------------------------
# Sprint 2: Ollama Embed & Health Integration Tests (Issue #62)
# ---------------------------------------------------------------------------

from unittest.mock import MagicMock, patch
import httpx


def test_health_reports_ollama_reachable_when_available():
    """When Ollama /api/tags returns 200, health reports reachable=True."""
    mock_resp = MagicMock()
    mock_resp.status_code = 200

    with patch("main._send_ollama_request", return_value=mock_resp):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["service"] == "ai-service"
        assert "ollama" in data
        assert data["ollama"]["reachable"] is True
        assert data["ollama"]["model"] == "nomic-embed-text"


def test_health_reports_ollama_down_when_unavailable():
    """When Ollama cannot be reached, health still returns 200 with reachable=False."""
    with patch("main._send_ollama_request", side_effect=httpx.ConnectError("Connection refused")):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["ollama"]["reachable"] is False


def test_app_starts_and_operates_when_ollama_unavailable():
    """Service starts and non-Ollama endpoints (like /suggest) still work when Ollama is down (FR-18.4, NFR-12)."""
    with patch("main._send_ollama_request", side_effect=httpx.ConnectError("Connection refused")):
        # Health check succeeds
        health_resp = client.get("/health")
        assert health_resp.status_code == 200
        assert health_resp.json()["ollama"]["reachable"] is False

        # Suggest endpoint remains fully operational
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
        suggest_resp = client.post("/suggest", json=payload)
        assert suggest_resp.status_code == 200
        assert suggest_resp.json()["aiGenerated"] is True


def test_embed_returns_numeric_vector_on_success():
    """POST /embed returns a valid numeric vector and the model name."""
    mock_vector = [0.123, -0.456, 0.789, 0.0]
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "model": "nomic-embed-text",
        "embeddings": [mock_vector],
    }

    with patch("main._send_ollama_request", return_value=mock_resp) as mock_send:
        response = client.post("/embed", json={"text": "Checkout service connection timeout"})
        assert response.status_code == 200
        data = response.json()

        assert data["embedding"] == mock_vector
        assert data["model"] == "nomic-embed-text"
        assert all(isinstance(x, (int, float)) for x in data["embedding"])
        mock_send.assert_called_once()


def test_embed_sends_correct_input_and_configured_model():
    """POST /embed sends the exact input text and configured model to Ollama."""
    captured_calls = []

    def mock_send(method, path, json=None, timeout=10.0):
        captured_calls.append((method, path, json))
        resp = MagicMock()
        resp.status_code = 200
        resp.json.return_value = {"embeddings": [[0.1, 0.2, 0.3]]}
        return resp

    with patch("main._send_ollama_request", side_effect=mock_send):
        response = client.post("/embed", json={"text": "Service latency spiked on payments"})
        assert response.status_code == 200
        assert len(captured_calls) == 1
        method, path, body = captured_calls[0]
        assert method == "POST"
        assert path == "/api/embed"
        assert body["model"] == "nomic-embed-text"
        assert body["input"] == "Service latency spiked on payments"


def test_embed_respects_custom_model_environment_variable(monkeypatch):
    """POST /embed uses OLLAMA_EMBED_MODEL if overridden in the environment."""
    monkeypatch.setenv("OLLAMA_EMBED_MODEL", "all-minilm")
    captured_calls = []

    def mock_send(method, path, json=None, timeout=10.0):
        captured_calls.append(json)
        resp = MagicMock()
        resp.status_code = 200
        resp.json.return_value = {"embeddings": [[0.5, 0.6]]}
        return resp

    with patch("main._send_ollama_request", side_effect=mock_send):
        response = client.post("/embed", json={"text": "Custom model test"})
        assert response.status_code == 200
        data = response.json()
        assert data["model"] == "all-minilm"
        assert captured_calls[0]["model"] == "all-minilm"


def test_embed_supports_legacy_single_embedding_response_format():
    """POST /embed accepts Ollama's single-embedding response format {"embedding": [...] }."""
    mock_vector = [0.42, 0.84]
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "model": "nomic-embed-text",
        "embedding": mock_vector,
    }

    with patch("main._send_ollama_request", return_value=mock_resp):
        response = client.post("/embed", json={"text": "Testing fallback format"})
        assert response.status_code == 200
        assert response.json()["embedding"] == mock_vector


def test_embed_validation_error_on_empty_text():
    """POST /embed returns 422 when text is empty."""
    response = client.post("/embed", json={"text": ""})
    assert response.status_code == 422


def test_embed_validation_error_on_missing_body():
    """POST /embed returns 422 when body is empty."""
    response = client.post("/embed", json={})
    assert response.status_code == 422


def test_embed_validation_error_on_invalid_text_type():
    """POST /embed returns 422 when text is not a string."""
    response = client.post("/embed", json={"text": 12345})
    assert response.status_code == 422


def test_embed_handles_ollama_timeout_gracefully():
    """POST /embed returns 503 when Ollama request times out without crashing."""
    with patch("main._send_ollama_request", side_effect=httpx.TimeoutException("Read timed out")):
        response = client.post("/embed", json={"text": "Some text"})
        assert response.status_code == 503
        assert "timed out" in response.json()["detail"].lower()


def test_embed_handles_ollama_connection_failure_gracefully():
    """POST /embed returns 503 when Ollama is unreachable without crashing."""
    with patch("main._send_ollama_request", side_effect=httpx.ConnectError("Failed to connect")):
        response = client.post("/embed", json={"text": "Some text"})
        assert response.status_code == 503
        assert "cannot reach ollama" in response.json()["detail"].lower()


def test_embed_handles_ollama_error_status_gracefully():
    """POST /embed returns 502 when Ollama responds with an HTTP error code."""
    mock_resp = MagicMock()
    mock_resp.status_code = 500
    mock_resp.text = "Internal Server Error"

    with patch("main._send_ollama_request", return_value=mock_resp):
        response = client.post("/embed", json={"text": "Some text"})
        assert response.status_code == 502


def test_embed_handles_ollama_malformed_response_gracefully():
    """POST /embed returns 502 when Ollama returns an unexpected payload structure."""
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {"unexpected_key": "unexpected_value"}

    with patch("main._send_ollama_request", return_value=mock_resp):
        response = client.post("/embed", json={"text": "Some text"})
        assert response.status_code == 502


def test_send_ollama_request_constructs_proper_url():
    """_send_ollama_request correctly constructs URLs with get_ollama_url()."""
    from main import _send_ollama_request
    mock_client = MagicMock()
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_client.get.return_value = mock_resp
    mock_client.__enter__.return_value = mock_client

    with patch("main.httpx.Client", return_value=mock_client):
        resp = _send_ollama_request("GET", "/api/tags")
        assert resp.status_code == 200
        mock_client.get.assert_called_once_with("http://localhost:11434/api/tags")

