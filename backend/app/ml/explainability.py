from typing import List
from app.schemas.schemas import PredictionFactor

def compute_prediction_factors(features: dict, active_events: list = None) -> List[PredictionFactor]:
    """
    Transparent feature influence breakdown for dynamic ETA forecast.
    Decomposes the predicted additional delay into interpretable operational factors.
    """
    factors: List[PredictionFactor] = []

    # 1. Current Delay Momentum
    curr_delay = features.get("current_delay", 0.0)
    if curr_delay > 0:
        factors.append(PredictionFactor(
            name="Current Delay Propagation",
            impact_minutes=round(curr_delay * 0.45, 1),
            impact_direction="increases_delay",
            description=f"Existing deviation of {curr_delay:.0f} mins propagating downstream into subsequent block sections."
        ))

    # 2. Operational Events (Speed Restrictions, Signal Failures, etc.)
    event_severity = features.get("event_severity", 0)
    speed_restriction = features.get("speed_restriction", 0)
    if event_severity > 0 or speed_restriction > 0:
        event_impact = event_severity * 7.0 + (12.0 if speed_restriction > 0 else 0.0)
        event_desc = "Caution order speed restriction active." if speed_restriction > 0 else "Active trackside operational incident."
        if active_events and len(active_events) > 0:
            first_event = active_events[0]
            event_desc = f"{first_event.event_type} at {first_event.location} ({first_event.severity} severity)."
        factors.append(PredictionFactor(
            name="Operational Incident / Speed Caution",
            impact_minutes=round(event_impact, 1),
            impact_direction="increases_delay",
            description=event_desc
        ))

    # 3. Track Congestion & Block Headway
    congestion = features.get("congestion_level", 0.3)
    if congestion > 0.45:
        congestion_impact = (congestion - 0.45) * 18.0
        factors.append(PredictionFactor(
            name="Corridor Track Congestion",
            impact_minutes=round(congestion_impact, 1),
            impact_direction="increases_delay",
            description=f"High route density ({int(congestion*100)}% track occupancy) causing signal approach throttling."
        ))

    # 4. Weather Conditions
    weather_sev = features.get("weather_severity", 0)
    rainfall = features.get("rainfall", 0.0)
    visibility = features.get("visibility", 10.0)
    if weather_sev > 0 or rainfall > 5.0 or visibility < 2.0:
        weather_impact = (weather_sev * 4.0) + (rainfall * 0.1) + (6.0 if visibility < 1.0 else 0.0)
        factors.append(PredictionFactor(
            name="Adverse Weather & Reduced Visibility",
            impact_minutes=round(weather_impact, 1),
            impact_direction="increases_delay",
            description=f"Visibility at {visibility:.1f} km with {rainfall:.0f} mm/hr precipitation requiring precautionary locomotive speeds."
        ))

    # 5. Built-in Schedule Recovery Slack (Make-up Time)
    if curr_delay > 15.0 and event_severity == 0 and congestion < 0.5:
        recovery_minutes = min(curr_delay * 0.15, 12.0)
        factors.append(PredictionFactor(
            name="Engineered Schedule Recovery Slack",
            impact_minutes=round(recovery_minutes, 1),
            impact_direction="decreases_delay",
            description=f"Built-in cushion on high-speed clear track allows partial time recovery of ~{recovery_minutes:.0f} mins."
        ))

    # 6. Station Dwell Variation
    dwell = features.get("dwell_time", 3.0)
    if dwell > 5.0:
        factors.append(PredictionFactor(
            name="Extended Junction Dwell Overrun",
            impact_minutes=round(dwell - 3.0, 1),
            impact_direction="increases_delay",
            description=f"Longer passenger boarding and crew change dwell ({dwell:.0f} mins) at major junction."
        ))

    return factors
