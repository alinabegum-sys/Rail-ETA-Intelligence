import pytest
from app.ml.dataset_generator import generate_synthetic_section_dataset
from app.ml.predictor import predictor
from app.ml.explainability import compute_prediction_factors

def test_synthetic_data_generation():
    df = generate_synthetic_section_dataset(num_samples=100, random_state=123)
    assert len(df) == 100
    assert not df.isnull().values.any()
    assert "additional_delay" in df.columns
    assert "current_delay" in df.columns
    assert (df["current_speed"] > 0).all()

def test_ml_predictor_inference():
    sample_features = {
        "current_delay": 15.0,
        "current_speed": 85.0,
        "distance_to_next": 120.0,
        "historical_section_time": 80.0,
        "historical_delay": 4.0,
        "dwell_time": 3.0,
        "remaining_stops": 4,
        "time_of_day_hour": 14,
        "day_of_week": 2,
        "congestion_level": 0.4,
        "event_severity": 0,
        "speed_restriction": 0,
        "weather_severity": 0,
        "rainfall": 0.0,
        "visibility": 10.0,
        "preceding_train_delay": 0.0
    }
    pred_delay, confidence = predictor.predict_section_delay(sample_features)
    assert isinstance(pred_delay, float)
    assert 0.5 <= confidence <= 1.0

def test_prediction_factors():
    features = {
        "current_delay": 35.0,
        "congestion_level": 0.75,
        "event_severity": 3,
        "speed_restriction": 30,
        "weather_severity": 2,
        "rainfall": 30.0,
        "visibility": 1.5,
        "dwell_time": 7.0
    }
    factors = compute_prediction_factors(features)
    assert len(factors) >= 4
    factor_names = [f.name for f in factors]
    assert "Current Delay Propagation" in factor_names
    assert "Operational Incident / Speed Caution" in factor_names
