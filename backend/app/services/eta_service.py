import datetime
from typing import List, Tuple, Optional
from sqlalchemy.orm import Session
from app.database.models import Train, TrainStop, TrainPosition, OperationalEvent, Prediction, Station
from app.schemas.schemas import (
    TrainETAForecastResponse, StationETAPrediction, OperationalEventResponse, PredictionFactor
)
from app.ml.predictor import predictor
from app.ml.explainability import compute_prediction_factors

def parse_time_to_minutes(time_str: str) -> int:
    """Parses 'HH:MM' string to minutes from midnight."""
    if not time_str or time_str in ["Source", "Terminus", "--"]:
        return 0
    try:
        parts = time_str.split(":")
        return int(parts[0]) * 60 + int(parts[1])
    except Exception:
        return 0

def format_minutes_to_time(minutes: int, base_day_offset: int = 0) -> str:
    """Formats minutes from midnight into 'HH:MM' with optional day rollover '+1'."""
    day_rollover = minutes // 1440 + base_day_offset
    mins_in_day = int(minutes % 1440)
    hours = mins_in_day // 60
    mins = mins_in_day % 60
    time_repr = f"{hours:02d}:{mins:02d}"
    if day_rollover > 0:
        time_repr += f" (+{day_rollover}d)"
    return time_repr

def get_delay_status(delay_minutes: float) -> str:
    if delay_minutes <= 5.0:
        return "on_time"
    elif delay_minutes <= 20.0:
        return "minor_delay"
    elif delay_minutes <= 45.0:
        return "moderate_delay"
    else:
        return "major_delay"

class ETAService:
    @staticmethod
    def calculate_forecast(
        db: Session, 
        train_id: str, 
        simulated_clock: Optional[datetime.datetime] = None
    ) -> TrainETAForecastResponse:
        train = db.query(Train).filter(Train.train_id == train_id).first()
        if not train:
            raise ValueError(f"Train {train_id} not found")

        # Determine current simulation clock
        if simulated_clock is None:
            from app.services.simulation_engine import simulation_engine
            simulated_clock = simulation_engine.simulated_clock

        sim_hour = simulated_clock.hour
        sim_weekday = simulated_clock.weekday()

        # Get latest position
        position = (
            db.query(TrainPosition)
            .filter(TrainPosition.train_id == train_id)
            .order_by(TrainPosition.timestamp.desc())
            .first()
        )

        # Get active events
        active_events = (
            db.query(OperationalEvent)
            .filter(OperationalEvent.train_id == train_id, OperationalEvent.is_active == True)
            .all()
        )

        stops = (
            db.query(TrainStop)
            .filter(TrainStop.train_id == train_id)
            .order_by(TrainStop.sequence.asc())
            .all()
        )

        # Identify current section and next station
        next_station_code = position.next_station if position else ""
        current_delay = position.current_delay_minutes if position else 0.0
        current_speed = position.speed if position else 75.0

        # Find index of next station in stops
        next_idx = 0
        for idx, stop in enumerate(stops):
            stn = db.query(Station).filter(Station.station_id == stop.station_id).first()
            if stn and (stn.station_code == next_station_code or stn.station_id == next_station_code):
                next_idx = idx
                break

        # Operational event parameters
        event_severity = 0
        speed_restriction = 0
        for ev in active_events:
            if ev.severity == "Critical":
                event_severity = max(event_severity, 4)
            elif ev.severity == "Major":
                event_severity = max(event_severity, 3)
            elif ev.severity == "Moderate":
                event_severity = max(event_severity, 2)
            else:
                event_severity = max(event_severity, 1)

            if "Speed Restriction" in ev.event_type:
                speed_restriction = 30

        # Roll forward predictions across remaining stops
        station_predictions: List[StationETAPrediction] = []
        accumulated_ml_delay = current_delay
        running_confidence = 0.95
        first_section_factors = None

        prev_stop_dist = 0.0
        for idx, stop in enumerate(stops):
            stn = db.query(Station).filter(Station.station_id == stop.station_id).first()
            stn_name = stn.station_name if stn else f"Station {stop.station_id}"
            stn_code = stn.station_code if stn else stop.station_id
            
            is_passed = idx < next_idx
            is_next = idx == next_idx

            sched_arr_str = stop.scheduled_arrival
            sched_arr_mins = parse_time_to_minutes(sched_arr_str) if sched_arr_str != "Source" else parse_time_to_minutes(stop.scheduled_departure)

            if is_passed:
                station_predictions.append(StationETAPrediction(
                    sequence=stop.sequence,
                    station_id=stop.station_id,
                    station_code=stn_code,
                    station_name=stn_name,
                    distance_from_source=stop.distance_from_source,
                    scheduled_arrival=stop.scheduled_arrival,
                    baseline_eta="Departed",
                    predicted_eta="Departed",
                    scheduled_delay_minutes=0.0,
                    baseline_delay_minutes=0.0,
                    predicted_delay_minutes=0.0,
                    confidence_score=1.0,
                    status="on_time",
                    is_passed=True,
                    is_next=False
                ))
                prev_stop_dist = stop.distance_from_source
                continue

            section_distance = max(stop.distance_from_source - prev_stop_dist, 25.0)
            prev_stop_dist = stop.distance_from_source
            remaining_stops_count = len(stops) - idx

            # Formulate feature vector using strictly SIMULATION TIME
            features = {
                "current_delay": accumulated_ml_delay,
                "current_speed": current_speed if is_next else 85.0,
                "distance_to_next": section_distance,
                "historical_section_time": (section_distance / 85.0) * 60.0,
                "historical_delay": 3.0,
                "dwell_time": stop.historical_dwell_minutes,
                "remaining_stops": remaining_stops_count,
                "time_of_day_hour": sim_hour,  # Driven by simulation clock
                "day_of_week": sim_weekday,     # Driven by simulation clock
                "congestion_level": 0.55 if event_severity > 1 else 0.35,
                "event_severity": event_severity if is_next else max(0, event_severity - 1),
                "speed_restriction": speed_restriction if is_next else 0,
                "weather_severity": 1 if any("Weather" in e.event_type for e in active_events) else 0,
                "rainfall": 25.0 if any("Weather" in e.event_type for e in active_events) else 0.0,
                "visibility": 2.0 if any("Weather" in e.event_type for e in active_events) else 10.0,
                "preceding_train_delay": 12.0 if event_severity > 0 else 0.0
            }

            if first_section_factors is None:
                first_section_factors = compute_prediction_factors(features, active_events)

            # Predict additional section delay increment using ML Model
            sec_delay_increment, sec_conf = predictor.predict_section_delay(features)
            
            # Update accumulated delay
            accumulated_ml_delay = max(0.0, accumulated_ml_delay + sec_delay_increment)
            
            # Confidence gracefully decreases into the future
            running_confidence = max(0.60, round(running_confidence * 0.96, 2))

            # Baseline calculation: scheduled arrival + current delay
            baseline_arrival_mins = sched_arr_mins + int(current_delay)
            baseline_eta_str = format_minutes_to_time(baseline_arrival_mins)

            # ML prediction calculation: scheduled arrival + dynamically predicted accumulated delay
            ml_arrival_mins = sched_arr_mins + int(round(accumulated_ml_delay))
            ml_eta_str = format_minutes_to_time(ml_arrival_mins)

            status = get_delay_status(accumulated_ml_delay)

            station_predictions.append(StationETAPrediction(
                sequence=stop.sequence,
                station_id=stop.station_id,
                station_code=stn_code,
                station_name=stn_name,
                distance_from_source=stop.distance_from_source,
                scheduled_arrival=stop.scheduled_arrival,
                baseline_eta=baseline_eta_str,
                predicted_eta=ml_eta_str,
                scheduled_delay_minutes=0.0,
                baseline_delay_minutes=round(current_delay, 1),
                predicted_delay_minutes=round(accumulated_ml_delay, 1),
                confidence_score=running_confidence,
                status=status,
                is_passed=False,
                is_next=is_next
            ))

        next_stn_obj = db.query(Station).filter(
            (Station.station_code == next_station_code) | (Station.station_id == next_station_code)
        ).first()

        next_name = next_stn_obj.station_name if next_stn_obj else next_station_code

        active_event_responses = [
            OperationalEventResponse.model_validate(e) for e in active_events
        ]

        return TrainETAForecastResponse(
            train_id=train.train_id,
            train_number=train.train_number,
            train_name=train.train_name,
            current_delay_minutes=round(current_delay, 1),
            current_speed=round(current_speed, 1),
            next_station_code=next_station_code,
            next_station_name=next_name,
            active_events=active_event_responses,
            factors=first_section_factors or [],
            stops=station_predictions,
            model_version="v1.0-rf",
            last_updated=simulated_clock
        )
