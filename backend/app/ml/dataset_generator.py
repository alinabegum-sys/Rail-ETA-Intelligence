import numpy as np
import pandas as pd
from pathlib import Path
from app.config import settings

def generate_synthetic_section_dataset(num_samples: int = 12000, random_state: int = 42) -> pd.DataFrame:
    """
    Generates realistic historical train-section traversal data for Indian Railways.
    Features model operational physics: slack recovery, congestion compounding,
    preceding train block headway, weather impact, and operational disruptions.
    """
    np.random.seed(random_state)
    
    # 1. Section distance (km): typical IR inter-station section is 20 km to 220 km
    distance_to_next = np.random.uniform(20.0, 240.0, num_samples)
    
    # 2. Historical scheduled section running time (minutes) at nominal speed (70-110 km/h)
    nominal_speed = np.random.uniform(65.0, 120.0, num_samples)
    historical_section_time = (distance_to_next / nominal_speed) * 60.0
    
    # 3. Current entering delay (minutes)
    current_delay = np.random.exponential(scale=18.0, size=num_samples)
    current_delay = np.clip(current_delay, 0.0, 180.0)
    
    # 4. Current train speed entering section (km/h)
    speed_factor = np.clip(1.0 - (current_delay / 250.0) + np.random.normal(0, 0.1, num_samples), 0.3, 1.1)
    current_speed = nominal_speed * speed_factor
    
    # 5. Historical section delay pattern (-5 min recovery to +25 min habitual delay)
    historical_delay = np.random.normal(loc=3.5, scale=6.0, size=num_samples)
    
    # 6. Station dwell time (minutes)
    dwell_time = np.random.choice([2.0, 3.0, 5.0, 10.0, 15.0], size=num_samples, p=[0.35, 0.30, 0.20, 0.10, 0.05])
    dwell_overrun = np.random.exponential(scale=1.2, size=num_samples) * (np.random.rand(num_samples) > 0.4)
    total_dwell = dwell_time + dwell_overrun
    
    # 7. Remaining stops until destination (1 to 15)
    remaining_stops = np.random.randint(1, 16, num_samples)
    
    # 8. Time of day (hour 0-23) & Day of week (0-6)
    time_of_day_hour = np.random.randint(0, 24, num_samples)
    day_of_week = np.random.randint(0, 7, num_samples)
    
    # Peak corridor congestion during morning (07-10) and evening (17-21)
    is_peak_hour = ((time_of_day_hour >= 7) & (time_of_day_hour <= 10)) | ((time_of_day_hour >= 17) & (time_of_day_hour <= 21))
    
    # 9. Congestion level (0.0 clear track to 1.0 gridlock)
    base_congestion = np.random.beta(a=2, b=4, size=num_samples)
    congestion_level = np.clip(base_congestion + (0.25 * is_peak_hour) + np.random.normal(0, 0.05, num_samples), 0.0, 1.0)
    
    # 10. Operational event severity (0: None, 1: Minor, 2: Moderate, 3: Major, 4: Critical)
    event_prob = [0.65, 0.15, 0.10, 0.07, 0.03]
    event_severity = np.random.choice([0, 1, 2, 3, 4], size=num_samples, p=event_prob)
    
    # 11. Speed restriction (km/h limit: 0 means normal full track speed, 30/50/75 TSR)
    has_speed_restriction = np.random.choice([0, 30, 50, 75], size=num_samples, p=[0.72, 0.10, 0.10, 0.08])
    
    # 12. Weather factors
    weather_severity = np.random.choice([0, 1, 2, 3], size=num_samples, p=[0.75, 0.15, 0.07, 0.03])
    rainfall = np.where(weather_severity >= 2, np.random.uniform(15.0, 75.0, num_samples), 0.0)
    visibility = np.where(weather_severity == 1, np.random.uniform(0.1, 1.2, num_samples),
                 np.where(weather_severity >= 2, np.random.uniform(1.5, 4.0, num_samples), 10.0))
    
    # 13. Preceding train delay in automatic signaling block (minutes)
    preceding_train_delay = np.random.exponential(scale=8.0, size=num_samples) * (congestion_level > 0.4)
    preceding_train_delay = np.clip(preceding_train_delay, 0.0, 60.0)
    
    # TARGET GENERATION: Additional section delay (minutes)
    congestion_delay = np.where(congestion_level > 0.5, (congestion_level - 0.5) * 22.0, 0.0)
    event_impact = event_severity * 6.5 + (event_severity ** 1.6) * 2.0
    
    safe_tsr = np.maximum(has_speed_restriction, 1)
    tsr_impact = np.where(has_speed_restriction > 0, 
                          (distance_to_next / safe_tsr - distance_to_next / nominal_speed) * 60.0 * 0.4, 
                          0.0)
    tsr_impact = np.clip(tsr_impact, 0.0, 35.0)
    
    weather_impact = (weather_severity * 3.5) + (rainfall * 0.1) + np.where(visibility < 1.0, 8.0, 0.0)
    preceding_impact = preceding_train_delay * 0.35
    
    potential_recovery = np.where(
        (current_delay > 10.0) & (congestion_level < 0.45) & (event_severity == 0) & (has_speed_restriction == 0),
        np.clip(current_delay * 0.12, 0.0, 14.0),
        0.0
    )
    
    raw_additional_delay = (
        congestion_delay + 
        event_impact + 
        tsr_impact + 
        weather_impact + 
        preceding_impact + 
        dwell_overrun * 0.7 +
        historical_delay * 0.25 - 
        potential_recovery + 
        np.random.normal(loc=0.5, scale=2.0, size=num_samples)
    )
    
    additional_delay = np.clip(raw_additional_delay, -12.0, 95.0)
    
    df = pd.DataFrame({
        "distance_to_next": np.round(distance_to_next, 1),
        "nominal_speed": np.round(nominal_speed, 1),
        "historical_section_time": np.round(historical_section_time, 1),
        "current_delay": np.round(current_delay, 1),
        "current_speed": np.round(current_speed, 1),
        "historical_delay": np.round(historical_delay, 1),
        "dwell_time": np.round(total_dwell, 1),
        "remaining_stops": remaining_stops,
        "time_of_day_hour": time_of_day_hour,
        "day_of_week": day_of_week,
        "congestion_level": np.round(congestion_level, 2),
        "event_severity": event_severity,
        "speed_restriction": has_speed_restriction,
        "weather_severity": weather_severity,
        "rainfall": np.round(rainfall, 1),
        "visibility": np.round(visibility, 1),
        "preceding_train_delay": np.round(preceding_train_delay, 1),
        "additional_delay": np.round(additional_delay, 1)
    })
    
    output_path = Path(settings.SYNTHETIC_DATA_PATH)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(output_path, index=False)
    return df
