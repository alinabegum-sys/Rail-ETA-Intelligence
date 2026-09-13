import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["sih_problem_id"] == "SIH26028"
    assert "DEMO / SIMULATION" in data["mode"]

def test_get_trains():
    response = client.get("/api/trains")
    assert response.status_code == 200
    trains = response.json()
    assert len(trains) >= 5
    first = trains[0]
    assert "train_id" in first
    assert "train_name" in first
    assert "current_delay_minutes" in first
    assert "predicted_final_eta" in first

def test_get_train_eta_forecast():
    response = client.get("/api/trains/TRN_12301/eta")
    assert response.status_code == 200
    data = response.json()
    assert data["train_number"] == "12301"
    assert len(data["stops"]) >= 5
    assert len(data["factors"]) >= 1
    for stop in data["stops"]:
        assert "scheduled_arrival" in stop
        assert "baseline_eta" in stop
        assert "predicted_eta" in stop
        assert "confidence_score" in stop

def test_simulation_step_and_event():
    step_resp = client.post("/api/simulation/step", json={"minutes_to_advance": 15})
    assert step_resp.status_code == 200
    assert step_resp.json()["step_count"] >= 1

    event_payload = {
        "train_id": "TRN_12951",
        "event_type": "Signal Delay",
        "severity": "Moderate",
        "duration_minutes": 15.0,
        "location": "Godhra Yard",
        "description": "Signal aspect failure"
    }
    event_resp = client.post("/api/simulation/event", json=event_payload)
    assert event_resp.status_code == 200
    assert event_resp.json()["event_type"] == "Signal Delay"

def test_analytics_endpoints():
    model_resp = client.get("/api/analytics/model")
    assert model_resp.status_code == 200
    metrics = model_resp.json()
    assert "ml_mae" in metrics
    assert "baseline_mae" in metrics
    assert metrics["ml_mae"] < metrics["baseline_mae"]
    assert "feature_importances" in metrics

    perf_resp = client.get("/api/analytics/performance")
    assert perf_resp.status_code == 200
    perf = perf_resp.json()
    assert "delay_distribution" in perf
    assert "error_comparison" in perf
    assert "punctuality_breakdown" in perf
