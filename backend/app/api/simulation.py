from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database.session import get_db
from app.database.models import OperationalEvent
from app.schemas.schemas import (
    SimulationStateResponse, SimulationStepRequest, OperationalEventCreate,
    OperationalEventResponse
)
from app.services.simulation_engine import simulation_engine

router = APIRouter(prefix="/simulation", tags=["Simulation"])

@router.get("/state", response_model=SimulationStateResponse)
def get_simulation_state(db: Session = Depends(get_db)):
    """Returns the current state of the railway simulation environment."""
    return simulation_engine.get_state(db)

@router.post("/start")
def start_simulation():
    """Starts continuous background simulation ticking."""
    simulation_engine.is_running = True
    return {"status": "started", "is_running": True}

@router.post("/pause")
def pause_simulation():
    """Pauses background simulation ticking."""
    simulation_engine.is_running = False
    return {"status": "paused", "is_running": False}

@router.post("/step", response_model=SimulationStateResponse)
def step_simulation(request: SimulationStepRequest = SimulationStepRequest(), db: Session = Depends(get_db)):
    """Advances simulation forward by designated minutes, advancing trains and updating ETAs."""
    simulation_engine.step(db, minutes_to_advance=request.minutes_to_advance)
    return simulation_engine.get_state(db)

@router.post("/reset", response_model=SimulationStateResponse)
def reset_simulation(db: Session = Depends(get_db)):
    """Resets all trains, positions, and active events back to default demo state."""
    simulation_engine.reset(db)
    return simulation_engine.get_state(db)

@router.post("/event", response_model=OperationalEventResponse)
def inject_simulation_event(event_data: OperationalEventCreate, db: Session = Depends(get_db)):
    """
    Injects a real-time operational disruption (Speed restriction, Signal failure, Congestion, Weather, etc.)
    and immediately recalculates downstream train predictions.
    """
    event = simulation_engine.inject_event(
        db=db,
        train_id=event_data.train_id,
        event_type=event_data.event_type,
        severity=event_data.severity,
        duration_minutes=event_data.duration_minutes,
        location=event_data.location,
        description=event_data.description or f"{event_data.event_type} disruption encountered"
    )
    return OperationalEventResponse.model_validate(event)

@router.post("/event/{event_id}/resolve")
def resolve_simulation_event(event_id: str, db: Session = Depends(get_db)):
    """Resolves an operational event, clears caution orders, and allows trains to recover speed."""
    simulation_engine.resolve_event(db, event_id)
    return {"status": "resolved", "event_id": event_id}

@router.get("/events", response_model=List[OperationalEventResponse])
def list_active_events(db: Session = Depends(get_db)):
    """Lists all active operational disruptions across the network."""
    events = (
        db.query(OperationalEvent)
        .filter(OperationalEvent.is_active == True)
        .order_by(OperationalEvent.timestamp.desc())
        .all()
    )
    return [OperationalEventResponse.model_validate(e) for e in events]
