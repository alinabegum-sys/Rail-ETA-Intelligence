export type DelayStatus = 'on_time' | 'minor_delay' | 'moderate_delay' | 'major_delay';

export interface TrainSummary {
  train_id: string;
  train_number: string;
  train_name: string;
  train_type: string;
  source: string;
  destination: string;
  total_distance: number;
  scheduled_start: string;
  current_station: string | null;
  next_station: string;
  speed: number;
  latitude: number;
  longitude: number;
  current_delay_minutes: number;
  predicted_final_delay: number;
  predicted_final_eta: string;
  status: DelayStatus;
  has_active_event: boolean;
  event_type: string | null;
}

export interface TrainStop {
  station_id: string;
  station_code: string;
  station_name: string;
  sequence: number;
  scheduled_arrival: string;
  scheduled_departure: string;
  historical_dwell_minutes: number;
  distance_from_source: number;
  latitude: number;
  longitude: number;
}

export interface OperationalEvent {
  event_id: string;
  train_id: string;
  event_type: string;
  severity: 'Minor' | 'Moderate' | 'Major' | 'Critical';
  duration_minutes: number;
  location: string;
  timestamp: string;
  description?: string;
  is_active: boolean;
}

export interface EventHistoryItem {
  id: string;
  train_number: string;
  event_type: string;
  severity: string;
  location: string;
  before_delay: number;
  after_delay: number;
  timestamp: string;
  is_active: boolean;
}

export interface PredictionFactor {
  name: string;
  impact_minutes: number;
  impact_direction: 'increases_delay' | 'decreases_delay';
  description: string;
}

export interface StationETAPrediction {
  sequence: number;
  station_id: string;
  station_code: string;
  station_name: string;
  distance_from_source: number;
  scheduled_arrival: string;
  baseline_eta: string;
  predicted_eta: string;
  scheduled_delay_minutes: number;
  baseline_delay_minutes: number;
  predicted_delay_minutes: number;
  confidence_score: number;
  status: DelayStatus;
  is_passed: boolean;
  is_next: boolean;
}

export interface TrainETAForecast {
  train_id: string;
  train_number: string;
  train_name: string;
  current_delay_minutes: number;
  current_speed: number;
  next_station_code: string;
  next_station_name: string;
  active_events: OperationalEvent[];
  factors: PredictionFactor[];
  stops: StationETAPrediction[];
  model_version: string;
  last_updated: string;
}

export interface SimulationState {
  is_running: boolean;
  simulated_time: string;
  simulated_datetime?: string;
  step_count: number;
  active_trains_count: number;
  total_active_events: number;
  trains: TrainSummary[];
}

export interface ModelMetrics {
  model_name: string;
  model_version: string;
  dataset_samples: number;
  train_test_split: string;
  features: string[];
  baseline_mae: number;
  baseline_rmse: number;
  baseline_r2: number;
  ml_mae: number;
  ml_rmse: number;
  ml_r2: number;
  improvement_percent: number;
  feature_importances: Record<string, number>;
  trained_at: string;
}

export interface PerformanceAnalytics {
  model_metrics: ModelMetrics;
  delay_distribution: Array<{ range: string; count: number; status: string }>;
  error_comparison: Array<{
    horizon: string;
    baseline_mae: number;
    ml_mae: number;
    baseline_rmse: number;
    ml_rmse: number;
  }>;
  punctuality_breakdown: Array<{
    corridor: string;
    punctuality_pct: number;
    avg_delay: number;
  }>;
  route_delay_analysis: Array<{
    section_type: string;
    avg_section_delay: number;
    recovery_rate: string;
  }>;
  simulation_events_summary: Array<{
    event_type: string;
    count: number;
  }>;
}
