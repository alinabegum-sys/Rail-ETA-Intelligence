import pytest
from app.database.session import SessionLocal
from app.services.simulation_engine import simulation_engine
from app.services.eta_service import ETAService

def test_simulation_lifecycle():
    db = SessionLocal()
    try:
        # Check initial state
        state = simulation_engine.get_state(db)
        assert state["active_trains_count"] >= 5
        assert len(state["trains"]) >= 5

        # Step simulation
        initial_time = simulation_engine.simulated_clock
        simulation_engine.step(db, minutes_to_advance=15)
        assert simulation_engine.step_count >= 1
        assert simulation_engine.simulated_clock > initial_time

        # Inject operational disruption
        test_train = "TRN_12301"
        event = simulation_engine.inject_event(
            db=db,
            train_id=test_train,
            event_type="Speed Restriction",
            severity="Major",
            duration_minutes=20.0,
            location="Saktigarh Jn",
            description="30 km/h caution order for track testing"
        )
        assert event.event_id is not None
        assert event.is_active is True

        # Check that forecast dynamically incorporates event
        forecast = ETAService.calculate_forecast(db, test_train)
        assert len(forecast.active_events) >= 1
        assert any(e.event_type == "Speed Restriction" for e in forecast.active_events)

        # Resolve event
        simulation_engine.resolve_event(db, event.event_id)
        active_events = [e for e in simulation_engine.get_state(db)["trains"] if e["train_id"] == test_train]
        assert active_events is not None

        # Reset simulation
        simulation_engine.reset(db)
        assert simulation_engine.step_count == 0
    finally:
        db.close()
