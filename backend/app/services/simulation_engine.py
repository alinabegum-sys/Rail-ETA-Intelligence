import datetime
import math
from typing import Optional, List, Dict
from sqlalchemy.orm import Session
from app.database.session import SessionLocal
from app.database.models import Train, TrainStop, TrainPosition, OperationalEvent, Station
from app.database.seed_data import TRAINS_DATA
from app.services.eta_service import ETAService

# Indian Standard Time (UTC +05:30)
IST_TZ = datetime.timezone(datetime.timedelta(hours=5, minutes=30))

def get_real_ist_now() -> datetime.datetime:
    """Returns current system time in Indian Standard Time (Asia/Kolkata)."""
    return datetime.datetime.now(IST_TZ)

class SimulationEngine:
    _instance = None

    def __init__(self):
        self.is_running: bool = False
        self.step_count: int = 0
        # Initialize simulation clock close to current real IST time
        self.simulated_clock = get_real_ist_now().replace(second=0, microsecond=0)

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def get_state(self, db: Session) -> dict:
        trains = db.query(Train).all()
        train_summaries = []
        for t in trains:
            pos = (
                db.query(TrainPosition)
                .filter(TrainPosition.train_id == t.train_id)
                .order_by(TrainPosition.timestamp.desc())
                .first()
            )
            active_ev = (
                db.query(OperationalEvent)
                .filter(OperationalEvent.train_id == t.train_id, OperationalEvent.is_active == True)
                .first()
            )
            
            # Predict downstream terminus ETA using the simulation clock
            forecast = ETAService.calculate_forecast(db, t.train_id, simulated_clock=self.simulated_clock)
            terminus_stop = forecast.stops[-1] if forecast.stops else None

            status = "on_time"
            curr_delay = pos.current_delay_minutes if pos else 0.0
            if curr_delay > 45.0:
                status = "major_delay"
            elif curr_delay > 20.0:
                status = "moderate_delay"
            elif curr_delay > 5.0:
                status = "minor_delay"

            next_stn_code = pos.next_station if pos else ""
            next_stn = db.query(Station).filter(
                (Station.station_code == next_stn_code) | (Station.station_id == next_stn_code)
            ).first()
            next_stn_name = next_stn.station_name if next_stn else next_stn_code

            curr_stn_code = pos.current_station if pos else None
            curr_stn_name = None
            if curr_stn_code:
                curr_stn = db.query(Station).filter(
                    (Station.station_code == curr_stn_code) | (Station.station_id == curr_stn_code)
                ).first()
                curr_stn_name = curr_stn.station_name if curr_stn else curr_stn_code

            train_summaries.append({
                "train_id": t.train_id,
                "train_number": t.train_number,
                "train_name": t.train_name,
                "train_type": t.train_type,
                "source": t.source,
                "destination": t.destination,
                "total_distance": t.total_distance,
                "scheduled_start": t.scheduled_start,
                "current_station": curr_stn_name or curr_stn_code,
                "next_station": next_stn_name,
                "speed": pos.speed if pos else 0.0,
                "latitude": pos.latitude if pos else 28.6430,
                "longitude": pos.longitude if pos else 77.2197,
                "current_delay_minutes": round(curr_delay, 1),
                "predicted_final_delay": round(terminus_stop.predicted_delay_minutes if terminus_stop else curr_delay, 1),
                "predicted_final_eta": terminus_stop.predicted_eta if terminus_stop else "--:--",
                "status": status,
                "has_active_event": active_ev is not None,
                "event_type": active_ev.event_type if active_ev else None
            })

        active_events_count = db.query(OperationalEvent).filter(OperationalEvent.is_active == True).count()

        return {
            "is_running": self.is_running,
            "simulated_time": self.simulated_clock.strftime("%H:%M:%S"),
            "simulated_datetime": self.simulated_clock.strftime("%Y-%m-%d %H:%M:%S (IST)"),
            "step_count": self.step_count,
            "active_trains_count": len(trains),
            "total_active_events": active_events_count,
            "trains": train_summaries
        }

    def step(self, db: Session, minutes_to_advance: int = 15):
        """Advances simulation forward by designated minutes."""
        self.step_count += 1
        self.simulated_clock += datetime.timedelta(minutes=minutes_to_advance)

        trains = db.query(Train).all()
        for t in trains:
            pos = (
                db.query(TrainPosition)
                .filter(TrainPosition.train_id == t.train_id)
                .order_by(TrainPosition.timestamp.desc())
                .first()
            )
            if not pos:
                continue

            active_events = (
                db.query(OperationalEvent)
                .filter(OperationalEvent.train_id == t.train_id, OperationalEvent.is_active == True)
                .all()
            )

            # Determine delay adjustment for this step
            if active_events:
                highest_severity = "Moderate"
                for ev in active_events:
                    if ev.severity in ["Critical", "Major"]:
                        highest_severity = ev.severity
                
                delay_delta = 6.0 if highest_severity == "Critical" else (4.0 if highest_severity == "Major" else 2.5)
                pos.current_delay_minutes = min(240.0, pos.current_delay_minutes + delay_delta)
            else:
                # Clear track recovery: if delayed, trains make up time
                if pos.current_delay_minutes > 5.0:
                    pos.current_delay_minutes = max(0.0, pos.current_delay_minutes - 2.5)

            # Advance coordinates towards next station
            next_stn = db.query(Station).filter(
                (Station.station_code == pos.next_station) | (Station.station_id == pos.next_station)
            ).first()

            if next_stn:
                lat_diff = next_stn.latitude - pos.latitude
                lng_diff = next_stn.longitude - pos.longitude
                dist_to_next = math.sqrt(lat_diff**2 + lng_diff**2)

                if dist_to_next < 0.15:
                    stops = (
                        db.query(TrainStop)
                        .filter(TrainStop.train_id == t.train_id)
                        .order_by(TrainStop.sequence.asc())
                        .all()
                    )
                    curr_idx = -1
                    for idx, s in enumerate(stops):
                        if s.station_id == next_stn.station_id:
                            curr_idx = idx
                            break
                    if curr_idx != -1 and curr_idx + 1 < len(stops):
                        subsequent_stop = stops[curr_idx + 1]
                        sub_stn = db.query(Station).filter(Station.station_id == subsequent_stop.station_id).first()
                        pos.current_station = next_stn.station_code
                        pos.next_station = sub_stn.station_code if sub_stn else subsequent_stop.station_id
                        pos.latitude = next_stn.latitude
                        pos.longitude = next_stn.longitude
                else:
                    step_fraction = min(0.35, (pos.speed * (minutes_to_advance / 60.0)) / 120.0)
                    pos.latitude += lat_diff * step_fraction
                    pos.longitude += lng_diff * step_fraction

            pos.timestamp = datetime.datetime.utcnow()
            db.add(pos)

        db.commit()

    def inject_event(
        self, db: Session, train_id: str, event_type: str, severity: str, duration_minutes: float, location: str, description: str
    ) -> OperationalEvent:
        """Injects a real operational event and updates train running state."""
        event_id = f"EVT_{train_id}_{int(datetime.datetime.utcnow().timestamp())}"
        event = OperationalEvent(
            event_id=event_id,
            train_id=train_id,
            event_type=event_type,
            severity=severity,
            duration_minutes=duration_minutes,
            location=location,
            description=description,
            timestamp=datetime.datetime.utcnow(),
            is_active=True
        )
        db.add(event)

        pos = (
            db.query(TrainPosition)
            .filter(TrainPosition.train_id == train_id)
            .order_by(TrainPosition.timestamp.desc())
            .first()
        )

        delay_impact_map = {
            "Critical": 22.0,
            "Major": 15.0,
            "Moderate": 8.0,
            "Minor": 4.0
        }
        delay_increment = delay_impact_map.get(severity, 8.0)

        if pos:
            pos.current_delay_minutes += delay_increment
            if event_type == "Speed Restriction":
                pos.speed = min(pos.speed, 30.0)
            elif event_type == "Unscheduled Halt":
                pos.speed = 0.0
            elif event_type == "Signal Delay":
                pos.speed = min(pos.speed, 20.0)
            elif event_type == "Weather Disruption":
                pos.speed = min(pos.speed, 45.0)
            elif event_type == "Heavy Congestion":
                pos.speed = min(pos.speed, 50.0)
            elif event_type == "Track Maintenance":
                pos.speed = min(pos.speed, 35.0)
            db.add(pos)

        db.commit()
        db.refresh(event)
        return event

    def resolve_event(self, db: Session, event_id: str):
        """Resolves an operational event and restores speed."""
        event = db.query(OperationalEvent).filter(OperationalEvent.event_id == event_id).first()
        if event:
            event.is_active = False
            pos = (
                db.query(TrainPosition)
                .filter(TrainPosition.train_id == event.train_id)
                .order_by(TrainPosition.timestamp.desc())
                .first()
            )
            if pos:
                pos.speed = 95.0
                db.add(pos)
            db.commit()

    def reset(self, db: Session):
        """Resets all trains and events back to initial seed configuration, synchronizing clock with real IST."""
        self.step_count = 0
        self.simulated_clock = get_real_ist_now().replace(second=0, microsecond=0)
        self.is_running = False

        db.query(OperationalEvent).delete()

        for t_data in TRAINS_DATA:
            pos_data = t_data["position"]
            pos = (
                db.query(TrainPosition)
                .filter(TrainPosition.train_id == t_data["train_id"])
                .first()
            )
            if pos:
                pos.latitude = pos_data["latitude"]
                pos.longitude = pos_data["longitude"]
                pos.current_station = pos_data["current_station"]
                pos.next_station = pos_data["next_station"]
                pos.speed = pos_data["speed"]
                pos.current_delay_minutes = pos_data["current_delay_minutes"]
                pos.timestamp = datetime.datetime.utcnow()
                db.add(pos)

            if t_data["event"]:
                ev = t_data["event"]
                op_event = OperationalEvent(
                    event_id=f"EVT_{t_data['train_id']}_init",
                    train_id=t_data["train_id"],
                    event_type=ev["event_type"],
                    severity=ev["severity"],
                    duration_minutes=ev["duration_minutes"],
                    location=ev["location"],
                    description=ev["description"],
                    timestamp=datetime.datetime.utcnow(),
                    is_active=True
                )
                db.add(op_event)

        db.commit()

simulation_engine = SimulationEngine.get_instance()
