from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database.session import get_db
from app.database.models import Train, TrainStop, TrainPosition, Station, OperationalEvent
from app.schemas.schemas import (
    TrainSummaryResponse, TrainStopResponse, TrainPositionResponse,
    TrainETAForecastResponse, OperationalEventResponse
)
from app.services.eta_service import ETAService
from app.services.simulation_engine import simulation_engine

router = APIRouter(prefix="/trains", tags=["Trains"])

@router.get("", response_model=List[TrainSummaryResponse])
def get_trains(db: Session = Depends(get_db)):
    """List all trains with current running status, delay, and ML predicted terminus arrival."""
    state = simulation_engine.get_state(db)
    return state["trains"]

@router.get("/{train_id}")
def get_train_detail(train_id: str, db: Session = Depends(get_db)):
    """Get train details, active events, and current position."""
    train = db.query(Train).filter(Train.train_id == train_id).first()
    if not train:
        raise HTTPException(status_code=404, detail=f"Train {train_id} not found")

    pos = (
        db.query(TrainPosition)
        .filter(TrainPosition.train_id == train_id)
        .order_by(TrainPosition.timestamp.desc())
        .first()
    )
    events = (
        db.query(OperationalEvent)
        .filter(OperationalEvent.train_id == train_id, OperationalEvent.is_active == True)
        .all()
    )

    return {
        "train_id": train.train_id,
        "train_number": train.train_number,
        "train_name": train.train_name,
        "train_type": train.train_type,
        "source": train.source,
        "destination": train.destination,
        "total_distance": train.total_distance,
        "scheduled_start": train.scheduled_start,
        "position": {
            "latitude": pos.latitude if pos else 0.0,
            "longitude": pos.longitude if pos else 0.0,
            "speed": pos.speed if pos else 0.0,
            "current_delay_minutes": pos.current_delay_minutes if pos else 0.0,
            "current_station": pos.current_station if pos else None,
            "next_station": pos.next_station if pos else ""
        },
        "active_events": [OperationalEventResponse.model_validate(e) for e in events]
    }

@router.get("/{train_id}/route", response_model=List[TrainStopResponse])
def get_train_route(train_id: str, db: Session = Depends(get_db)):
    """Get ordered route station stops with scheduled timings and geographical coordinates."""
    stops = (
        db.query(TrainStop)
        .filter(TrainStop.train_id == train_id)
        .order_by(TrainStop.sequence.asc())
        .all()
    )
    if not stops:
        raise HTTPException(status_code=404, detail=f"No route found for train {train_id}")

    results = []
    for s in stops:
        stn = db.query(Station).filter(Station.station_id == s.station_id).first()
        results.append(TrainStopResponse(
            station_id=s.station_id,
            station_code=stn.station_code if stn else s.station_id,
            station_name=stn.station_name if stn else f"Station {s.station_id}",
            sequence=s.sequence,
            scheduled_arrival=s.scheduled_arrival,
            scheduled_departure=s.scheduled_departure,
            historical_dwell_minutes=s.historical_dwell_minutes,
            distance_from_source=s.distance_from_source,
            latitude=stn.latitude if stn else 0.0,
            longitude=stn.longitude if stn else 0.0
        ))
    return results

@router.get("/{train_id}/position", response_model=TrainPositionResponse)
def get_train_position(train_id: str, db: Session = Depends(get_db)):
    """Get the current simulated GPS position, speed, and delay for a train."""
    pos = (
        db.query(TrainPosition)
        .filter(TrainPosition.train_id == train_id)
        .order_by(TrainPosition.timestamp.desc())
        .first()
    )
    if not pos:
        raise HTTPException(status_code=404, detail=f"Position for train {train_id} not found")
    return pos

@router.get("/{train_id}/eta", response_model=TrainETAForecastResponse)
@router.get("/{train_id}/predictions", response_model=TrainETAForecastResponse)
def get_train_eta_forecast(train_id: str, db: Session = Depends(get_db)):
    """Dynamically forecast ETA across upcoming stations using simulation clock and ML regression."""
    try:
        forecast = ETAService.calculate_forecast(db, train_id, simulated_clock=simulation_engine.simulated_clock)
        return forecast
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
