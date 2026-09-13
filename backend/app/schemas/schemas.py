from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict
from datetime import datetime

class StationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    station_id: str
    station_code: str
    station_name: str
    latitude: float
    longitude: float

class TrainStopResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    station_id: str
    station_code: str
    station_name: str
    sequence: int
    scheduled_arrival: str
    scheduled_departure: str
    historical_dwell_minutes: float
    distance_from_source: float
    latitude: float
    longitude: float

class TrainPositionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    latitude: float
    longitude: float
    current_station: Optional[str]
    next_station: str
    speed: float
    current_delay_minutes: float
    timestamp: datetime

class OperationalEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    event_id: str
    train_id: str
    event_type: str
    severity: str
    duration_minutes: float
    location: str
    timestamp: datetime
    description: Optional[str] = None
    is_active: bool

class OperationalEventCreate(BaseModel):
    train_id: str
    event_type: str
    severity: str = "Moderate"
    duration_minutes: float = 15.0
    location: str
    description: Optional[str] = None

class PredictionFactor(BaseModel):
    name: str
    impact_minutes: float
    impact_direction: str
    description: str

class StationETAPrediction(BaseModel):
    sequence: int
    station_id: str
    station_code: str
    station_name: str
    distance_from_source: float
    scheduled_arrival: str
    baseline_eta: str
    predicted_eta: str
    scheduled_delay_minutes: float = 0.0
    baseline_delay_minutes: float
    predicted_delay_minutes: float
    confidence_score: float
    status: str
    is_passed: bool = False
    is_next: bool = False

class TrainETAForecastResponse(BaseModel):
    train_id: str
    train_number: str
    train_name: str
    current_delay_minutes: float
    current_speed: float
    next_station_code: str
    next_station_name: str
    active_events: List[OperationalEventResponse]
    factors: List[PredictionFactor]
    stops: List[StationETAPrediction]
    model_version: str
    last_updated: datetime

class TrainSummaryResponse(BaseModel):
    train_id: str
    train_number: str
    train_name: str
    train_type: str
    source: str
    destination: str
    total_distance: float
    scheduled_start: str
    current_station: Optional[str]
    next_station: str
    speed: float
    latitude: float
    longitude: float
    current_delay_minutes: float
    predicted_final_delay: float
    predicted_final_eta: str
    status: str
    has_active_event: bool
    event_type: Optional[str] = None

class SimulationStateResponse(BaseModel):
    is_running: bool
    simulated_time: str
    simulated_datetime: Optional[str] = None
    step_count: int
    active_trains_count: int
    total_active_events: int
    trains: List[TrainSummaryResponse]

class SimulationStepRequest(BaseModel):
    minutes_to_advance: int = 15

class ModelMetricsResponse(BaseModel):
    model_name: str
    model_version: str
    dataset_samples: int
    train_test_split: str
    features: List[str]
    baseline_mae: float
    baseline_rmse: float
    baseline_r2: float
    ml_mae: float
    ml_rmse: float
    ml_r2: float
    improvement_percent: float
    feature_importances: Dict[str, float]
    trained_at: str

class PerformanceAnalyticsResponse(BaseModel):
    model_metrics: ModelMetricsResponse
    delay_distribution: List[Dict[str, Any]]
    error_comparison: List[Dict[str, Any]]
    punctuality_breakdown: List[Dict[str, Any]]
    route_delay_analysis: List[Dict[str, Any]]
    simulation_events_summary: List[Dict[str, Any]]
