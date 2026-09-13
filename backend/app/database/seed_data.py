import datetime
from app.database.session import SessionLocal, Base, engine
from app.database.models import (
    Train, Station, TrainStop, TrainPosition, OperationalEvent, Weather, Prediction
)

STATIONS_DATA = [
    {"station_id": "STN_NDLS", "station_code": "NDLS", "station_name": "New Delhi", "latitude": 28.6430, "longitude": 77.2197},
    {"station_id": "STN_CNB",  "station_code": "CNB",  "station_name": "Kanpur Central", "latitude": 26.4538, "longitude": 80.3513},
    {"station_id": "STN_PRYJ", "station_code": "PRYJ", "station_name": "Prayagraj Jn", "latitude": 25.4497, "longitude": 81.8282},
    {"station_id": "STN_DDU",  "station_code": "DDU",  "station_name": "Pt. Deen Dayal Upadhyaya", "latitude": 25.2798, "longitude": 83.1235},
    {"station_id": "STN_GAYA", "station_code": "GAYA", "station_name": "Gaya Jn", "latitude": 24.8028, "longitude": 84.9996},
    {"station_id": "STN_DHN",  "station_code": "DHN",  "station_name": "Dhanbad Jn", "latitude": 23.7957, "longitude": 86.4304},
    {"station_id": "STN_ASN",  "station_code": "ASN",  "station_name": "Asansol Jn", "latitude": 23.6844, "longitude": 86.9746},
    {"station_id": "STN_HWH",  "station_code": "HWH",  "station_name": "Howrah Jn", "latitude": 22.5839, "longitude": 88.3433},
    {"station_id": "STN_MMCT", "station_code": "MMCT", "station_name": "Mumbai Central", "latitude": 18.9696, "longitude": 72.8193},
    {"station_id": "STN_BVI",  "station_code": "BVI",  "station_name": "Borivali", "latitude": 19.2291, "longitude": 72.8569},
    {"station_id": "STN_ST",   "station_code": "ST",   "station_name": "Surat", "latitude": 21.2049, "longitude": 72.8406},
    {"station_id": "STN_BRC",  "station_code": "BRC",  "station_name": "Vadodara Jn", "latitude": 22.3106, "longitude": 73.1812},
    {"station_id": "STN_RTM",  "station_code": "RTM",  "station_name": "Ratlam Jn", "latitude": 23.3364, "longitude": 75.0374},
    {"station_id": "STN_KOTA", "station_code": "KOTA", "station_name": "Kota Jn", "latitude": 25.2223, "longitude": 75.8745},
    {"station_id": "STN_MAS",  "station_code": "MAS",  "station_name": "Chennai Central", "latitude": 13.0827, "longitude": 80.2707},
    {"station_id": "STN_AJJ",  "station_code": "AJJ",  "station_name": "Arakkonam Jn", "latitude": 13.0784, "longitude": 79.6685},
    {"station_id": "STN_KPD",  "station_code": "KPD",  "station_name": "Katpadi Jn", "latitude": 12.9734, "longitude": 79.1378},
    {"station_id": "STN_JTJ",  "station_code": "JTJ",  "station_name": "Jolarpettai Jn", "latitude": 12.5647, "longitude": 78.5837},
    {"station_id": "STN_BWT",  "station_code": "BWT",  "station_name": "Bangarapet", "latitude": 12.9936, "longitude": 78.1994},
    {"station_id": "STN_KJM",  "station_code": "KJM",  "station_name": "Krishnarajapuram", "latitude": 12.9972, "longitude": 77.6890},
    {"station_id": "STN_SBC",  "station_code": "SBC",  "station_name": "KSR Bengaluru", "latitude": 12.9784, "longitude": 77.5683},
    {"station_id": "STN_GZB",  "station_code": "GZB",  "station_name": "Ghaziabad Jn", "latitude": 28.6675, "longitude": 77.4378},
    {"station_id": "STN_ALJN", "station_code": "ALJN", "station_name": "Aligarh Jn", "latitude": 27.8974, "longitude": 78.0880},
    {"station_id": "STN_TDL",  "station_code": "TDL",  "station_name": "Tundla Jn", "latitude": 27.2064, "longitude": 78.2435},
    {"station_id": "STN_LKO",  "station_code": "LKO",  "station_name": "Lucknow Charbagh", "latitude": 26.8315, "longitude": 80.9234},
    {"station_id": "STN_BSB",  "station_code": "BSB",  "station_name": "Varanasi Jn", "latitude": 25.3267, "longitude": 82.9866},
    {"station_id": "STN_AGC",  "station_code": "AGC",  "station_name": "Agra Cantt", "latitude": 27.1594, "longitude": 77.9922},
    {"station_id": "STN_GWL",  "station_code": "GWL",  "station_name": "Gwalior Jn", "latitude": 26.2183, "longitude": 78.1828},
    {"station_id": "STN_VGLJ", "station_code": "VGLJ", "station_name": "V Lakshmibai Jhansi", "latitude": 25.4484, "longitude": 78.5685},
    {"station_id": "STN_BPL",  "station_code": "BPL",  "station_name": "Bhopal Jn", "latitude": 23.2685, "longitude": 77.4126},
    {"station_id": "STN_RKMP", "station_code": "RKMP", "station_name": "Rani Kamlapati", "latitude": 23.2044, "longitude": 77.4402},
    {"station_id": "STN_NGP",  "station_code": "NGP",  "station_name": "Nagpur Jn", "latitude": 21.1539, "longitude": 79.0882},
    {"station_id": "STN_BBS",  "station_code": "BBS",  "station_name": "Bhubaneswar", "latitude": 20.2666, "longitude": 85.8436},
    {"station_id": "STN_VSKP", "station_code": "VSKP", "station_name": "Visakhapatnam", "latitude": 17.7212, "longitude": 83.2882},
    {"station_id": "STN_BZA",  "station_code": "BZA",  "station_name": "Vijayawada Jn", "latitude": 16.5193, "longitude": 80.6205},
    {"station_id": "STN_SMVB", "station_code": "SMVB", "station_name": "SMVT Bengaluru", "latitude": 13.0036, "longitude": 77.6601},
    {"station_id": "STN_TVC",  "station_code": "TVC",  "station_name": "Thiruvananthapuram Cntl", "latitude": 8.4875, "longitude": 76.9532},
]

TRAINS_DATA = [
    # 1. On-Time Train (Delay: +3m)
    {
        "train_id": "TRN_12301",
        "train_number": "12301",
        "train_name": "Howrah Rajdhani Express",
        "train_type": "Rajdhani Express",
        "source": "Howrah Jn (HWH)",
        "destination": "New Delhi (NDLS)",
        "total_distance": 1451.0,
        "scheduled_start": "16:50",
        "stops": [
            {"station_id": "STN_HWH", "sequence": 1, "arr": "Source", "dep": "16:50", "dwell": 0.0, "dist": 0.0},
            {"station_id": "STN_ASN", "sequence": 2, "arr": "18:57", "dep": "19:00", "dwell": 3.0, "dist": 200.0},
            {"station_id": "STN_DHN", "sequence": 3, "arr": "19:50", "dep": "19:55", "dwell": 5.0, "dist": 259.0},
            {"station_id": "STN_GAYA", "sequence": 4, "arr": "22:19", "dep": "22:22", "dwell": 3.0, "dist": 459.0},
            {"station_id": "STN_DDU", "sequence": 5, "arr": "00:45", "dep": "00:55", "dwell": 10.0, "dist": 664.0},
            {"station_id": "STN_PRYJ", "sequence": 6, "arr": "02:43", "dep": "02:45", "dwell": 2.0, "dist": 816.0},
            {"station_id": "STN_CNB", "sequence": 7, "arr": "04:40", "dep": "04:45", "dwell": 5.0, "dist": 1010.0},
            {"station_id": "STN_NDLS", "sequence": 8, "arr": "10:05", "dep": "Terminus", "dwell": 0.0, "dist": 1451.0},
        ],
        "position": {
            "latitude": 25.3200, "longitude": 82.7000,
            "current_station": "STN_DDU", "next_station": "STN_PRYJ",
            "speed": 122.0, "current_delay_minutes": 3.0
        },
        "event": None
    },

    # 2. On-Time Train (Delay: +2m)
    {
        "train_id": "TRN_20607",
        "train_number": "20607",
        "train_name": "Vande Bharat Express (Chennai-Bengaluru)",
        "train_type": "Vande Bharat",
        "source": "Chennai Central (MAS)",
        "destination": "KSR Bengaluru (SBC)",
        "total_distance": 359.0,
        "scheduled_start": "05:50",
        "stops": [
            {"station_id": "STN_MAS", "sequence": 1, "arr": "Source", "dep": "05:50", "dwell": 0.0, "dist": 0.0},
            {"station_id": "STN_AJJ", "sequence": 2, "arr": "06:38", "dep": "06:40", "dwell": 2.0, "dist": 69.0},
            {"station_id": "STN_KPD", "sequence": 3, "arr": "07:13", "dep": "07:15", "dwell": 2.0, "dist": 130.0},
            {"station_id": "STN_JTJ", "sequence": 4, "arr": "08:18", "dep": "08:20", "dwell": 2.0, "dist": 214.0},
            {"station_id": "STN_KJM", "sequence": 5, "arr": "09:48", "dep": "09:50", "dwell": 2.0, "dist": 345.0},
            {"station_id": "STN_SBC", "sequence": 6, "arr": "10:20", "dep": "Terminus", "dwell": 0.0, "dist": 359.0},
        ],
        "position": {
            "latitude": 12.7800, "longitude": 78.8500,
            "current_station": "STN_KPD", "next_station": "STN_JTJ",
            "speed": 130.0, "current_delay_minutes": 2.0
        },
        "event": None
    },

    # 3. Mildly Delayed Train (Delay: +12m)
    {
        "train_id": "TRN_12951",
        "train_number": "12951",
        "train_name": "Mumbai Tejas Rajdhani",
        "train_type": "Tejas Rajdhani",
        "source": "Mumbai Central (MMCT)",
        "destination": "New Delhi (NDLS)",
        "total_distance": 1386.0,
        "scheduled_start": "17:00",
        "stops": [
            {"station_id": "STN_MMCT", "sequence": 1, "arr": "Source", "dep": "17:00", "dwell": 0.0, "dist": 0.0},
            {"station_id": "STN_BVI",  "sequence": 2, "arr": "17:22", "dep": "17:24", "dwell": 2.0, "dist": 30.0},
            {"station_id": "STN_ST",   "sequence": 3, "arr": "19:43", "dep": "19:48", "dwell": 5.0, "dist": 263.0},
            {"station_id": "STN_BRC",  "sequence": 4, "arr": "21:06", "dep": "21:16", "dwell": 10.0, "dist": 392.0},
            {"station_id": "STN_RTM",  "sequence": 5, "arr": "00:25", "dep": "00:28", "dwell": 3.0, "dist": 653.0},
            {"station_id": "STN_KOTA", "sequence": 6, "arr": "03:15", "dep": "03:20", "dwell": 5.0, "dist": 920.0},
            {"station_id": "STN_NDLS", "sequence": 7, "arr": "08:32", "dep": "Terminus", "dwell": 0.0, "dist": 1386.0},
        ],
        "position": {
            "latitude": 22.8000, "longitude": 74.0000,
            "current_station": "STN_BRC", "next_station": "STN_RTM",
            "speed": 98.0, "current_delay_minutes": 12.0
        },
        "event": {
            "event_type": "Track Congestion",
            "severity": "Minor",
            "duration_minutes": 10.0,
            "location": "Godhra - Dahod Ghat Section",
            "description": "Freight rake precedence clearance speed regulation"
        }
    },

    # 4. Mildly Delayed Train (Delay: +9m)
    {
        "train_id": "TRN_12002",
        "train_number": "12002",
        "train_name": "Bhopal Shatabdi Express",
        "train_type": "Shatabdi Express",
        "source": "New Delhi (NDLS)",
        "destination": "Rani Kamlapati (RKMP)",
        "total_distance": 708.0,
        "scheduled_start": "06:00",
        "stops": [
            {"station_id": "STN_NDLS", "sequence": 1, "arr": "Source", "dep": "06:00", "dwell": 0.0, "dist": 0.0},
            {"station_id": "STN_AGC",  "sequence": 2, "arr": "07:50", "dep": "07:55", "dwell": 5.0, "dist": 195.0},
            {"station_id": "STN_GWL",  "sequence": 3, "arr": "09:23", "dep": "09:28", "dwell": 5.0, "dist": 313.0},
            {"station_id": "STN_VGLJ", "sequence": 4, "arr": "10:45", "dep": "10:53", "dwell": 8.0, "dist": 411.0},
            {"station_id": "STN_BPL",  "sequence": 5, "arr": "14:07", "dep": "14:12", "dwell": 5.0, "dist": 702.0},
            {"station_id": "STN_RKMP", "sequence": 6, "arr": "14:40", "dep": "Terminus", "dwell": 0.0, "dist": 708.0},
        ],
        "position": {
            "latitude": 26.6000, "longitude": 78.1000,
            "current_station": "STN_AGC", "next_station": "STN_GWL",
            "speed": 115.0, "current_delay_minutes": 9.0
        },
        "event": None
    },

    # 5. Mildly Delayed Train (Delay: +16m)
    {
        "train_id": "TRN_12245",
        "train_number": "12245",
        "train_name": "Howrah - Bengaluru Duronto",
        "train_type": "Duronto Express",
        "source": "Howrah Jn (HWH)",
        "destination": "SMVT Bengaluru (SMVB)",
        "total_distance": 1944.0,
        "scheduled_start": "10:50",
        "stops": [
            {"station_id": "STN_HWH",  "sequence": 1, "arr": "Source", "dep": "10:50", "dwell": 0.0, "dist": 0.0},
            {"station_id": "STN_BBS",  "sequence": 2, "arr": "16:20", "dep": "16:30", "dwell": 10.0, "dist": 437.0},
            {"station_id": "STN_VSKP", "sequence": 3, "arr": "22:05", "dep": "22:25", "dwell": 20.0, "dist": 880.0},
            {"station_id": "STN_BZA",  "sequence": 4, "arr": "04:15", "dep": "04:25", "dwell": 10.0, "dist": 1230.0},
            {"station_id": "STN_SMVB", "sequence": 5, "arr": "15:50", "dep": "Terminus", "dwell": 0.0, "dist": 1944.0},
        ],
        "position": {
            "latitude": 18.8000, "longitude": 84.4000,
            "current_station": "STN_BBS", "next_station": "STN_VSKP",
            "speed": 92.0, "current_delay_minutes": 16.0
        },
        "event": {
            "event_type": "Track Maintenance",
            "severity": "Minor",
            "duration_minutes": 15.0,
            "location": "Brahmapur - Sompeta Curve",
            "description": "Routine ballast tamping caution order (45 km/h limit)"
        }
    },

    # 6. Moderately Delayed Train (Delay: +28m)
    {
        "train_id": "TRN_22436",
        "train_number": "22436",
        "train_name": "Vande Bharat Express (Delhi-Varanasi)",
        "train_type": "Vande Bharat",
        "source": "New Delhi (NDLS)",
        "destination": "Varanasi Jn (BSB)",
        "total_distance": 759.0,
        "scheduled_start": "06:00",
        "stops": [
            {"station_id": "STN_NDLS", "sequence": 1, "arr": "Source", "dep": "06:00", "dwell": 0.0, "dist": 0.0},
            {"station_id": "STN_CNB",  "sequence": 2, "arr": "10:08", "dep": "10:10", "dwell": 2.0, "dist": 440.0},
            {"station_id": "STN_PRYJ", "sequence": 3, "arr": "12:08", "dep": "12:10", "dwell": 2.0, "dist": 635.0},
            {"station_id": "STN_BSB",  "sequence": 4, "arr": "14:00", "dep": "Terminus", "dwell": 0.0, "dist": 759.0},
        ],
        "position": {
            "latitude": 26.6500, "longitude": 80.0500,
            "current_station": "STN_NDLS", "next_station": "STN_CNB",
            "speed": 35.0, "current_delay_minutes": 28.0
        },
        "event": {
            "event_type": "Speed Restriction",
            "severity": "Moderate",
            "duration_minutes": 25.0,
            "location": "Panki Dham - Kanpur Yard Approach",
            "description": "Caution order 30 km/h due to turnout renewal track engineering"
        }
    },

    # 7. Moderately Delayed Train (Delay: +38m)
    {
        "train_id": "TRN_12004",
        "train_number": "12004",
        "train_name": "New Delhi - Lucknow Shatabdi",
        "train_type": "Shatabdi Express",
        "source": "New Delhi (NDLS)",
        "destination": "Lucknow Charbagh (LKO)",
        "total_distance": 511.0,
        "scheduled_start": "06:10",
        "stops": [
            {"station_id": "STN_NDLS", "sequence": 1, "arr": "Source", "dep": "06:10", "dwell": 0.0, "dist": 0.0},
            {"station_id": "STN_GZB",  "sequence": 2, "arr": "06:48", "dep": "06:50", "dwell": 2.0, "dist": 25.0},
            {"station_id": "STN_ALJN", "sequence": 3, "arr": "07:47", "dep": "07:49", "dwell": 2.0, "dist": 131.0},
            {"station_id": "STN_TDL",  "sequence": 4, "arr": "08:45", "dep": "08:47", "dwell": 2.0, "dist": 209.0},
            {"station_id": "STN_CNB",  "sequence": 5, "arr": "11:20", "dep": "11:25", "dwell": 5.0, "dist": 439.0},
            {"station_id": "STN_LKO",  "sequence": 6, "arr": "12:40", "dep": "Terminus", "dwell": 0.0, "dist": 511.0},
        ],
        "position": {
            "latitude": 27.1500, "longitude": 78.4000,
            "current_station": "STN_TDL", "next_station": "STN_CNB",
            "speed": 55.0, "current_delay_minutes": 38.0
        },
        "event": {
            "event_type": "Signal Delay",
            "severity": "Moderate",
            "duration_minutes": 20.0,
            "location": "Etawah Junction Outer Signal",
            "description": "Automatic signaling glitch in Tundla-Kanpur quadruple line"
        }
    },

    # 8. Heavily Delayed Train (Delay: +78m)
    {
        "train_id": "TRN_12626",
        "train_number": "12626",
        "train_name": "Kerala Superfast Express",
        "train_type": "Superfast Express",
        "source": "New Delhi (NDLS)",
        "destination": "Thiruvananthapuram (TVC)",
        "total_distance": 3036.0,
        "scheduled_start": "20:10",
        "stops": [
            {"station_id": "STN_NDLS", "sequence": 1, "arr": "Source", "dep": "20:10", "dwell": 0.0, "dist": 0.0},
            {"station_id": "STN_AGC",  "sequence": 2, "arr": "22:20", "dep": "22:25", "dwell": 5.0, "dist": 195.0},
            {"station_id": "STN_GWL",  "sequence": 3, "arr": "23:56", "dep": "23:58", "dwell": 2.0, "dist": 313.0},
            {"station_id": "STN_VGLJ", "sequence": 4, "arr": "01:30", "dep": "01:38", "dwell": 8.0, "dist": 411.0},
            {"station_id": "STN_BPL",  "sequence": 5, "arr": "05:20", "dep": "05:25", "dwell": 5.0, "dist": 703.0},
            {"station_id": "STN_NGP",  "sequence": 6, "arr": "11:45", "dep": "11:50", "dwell": 5.0, "dist": 1093.0},
            {"station_id": "STN_BZA",  "sequence": 7, "arr": "21:30", "dep": "21:40", "dwell": 10.0, "dist": 1756.0},
            {"station_id": "STN_TVC",  "sequence": 8, "arr": "18:00", "dep": "Terminus", "dwell": 0.0, "dist": 3036.0},
        ],
        "position": {
            "latitude": 22.2000, "longitude": 78.3000,
            "current_station": "STN_BPL", "next_station": "STN_NGP",
            "speed": 62.0, "current_delay_minutes": 78.0
        },
        "event": {
            "event_type": "Weather Disruption",
            "severity": "Critical",
            "duration_minutes": 45.0,
            "location": "Betul - Itarsi Ghat Section",
            "description": "Heavy torrential monsoon rainfall and waterlogging caution notice"
        }
    }
]

def seed_database(force_reseed: bool = False):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    existing_trains = db.query(Train).count()
    if existing_trains >= 8 and not force_reseed:
        db.close()
        return

    print(f"Seeding / updating database (found {existing_trains} existing trains)...")
    
    # Upsert Stations
    for s in STATIONS_DATA:
        existing_stn = db.query(Station).filter(Station.station_id == s["station_id"]).first()
        if not existing_stn:
            db.add(Station(**s))
        else:
            existing_stn.station_code = s["station_code"]
            existing_stn.station_name = s["station_name"]
            existing_stn.latitude = s["latitude"]
            existing_stn.longitude = s["longitude"]
    db.commit()

    # Clear and reseed trains, stops, positions, and events to ensure deterministic state
    db.query(TrainStop).delete()
    db.query(TrainPosition).delete()
    db.query(OperationalEvent).delete()
    db.query(Train).delete()
    db.commit()

    print(f"Seeding {len(TRAINS_DATA)} coaching trains across Indian Railways corridors...")
    for t_data in TRAINS_DATA:
        train = Train(
            train_id=t_data["train_id"],
            train_number=t_data["train_number"],
            train_name=t_data["train_name"],
            train_type=t_data["train_type"],
            source=t_data["source"],
            destination=t_data["destination"],
            total_distance=t_data["total_distance"],
            scheduled_start=t_data["scheduled_start"],
            is_active=True
        )
        db.add(train)
        db.flush()

        for stop in t_data["stops"]:
            ts = TrainStop(
                train_id=train.train_id,
                station_id=stop["station_id"],
                sequence=stop["sequence"],
                scheduled_arrival=stop["arr"],
                scheduled_departure=stop["dep"],
                historical_dwell_minutes=stop["dwell"],
                distance_from_source=stop["dist"]
            )
            db.add(ts)

        pos = t_data["position"]
        tp = TrainPosition(
            train_id=train.train_id,
            latitude=pos["latitude"],
            longitude=pos["longitude"],
            current_station=pos["current_station"],
            next_station=pos["next_station"],
            speed=pos["speed"],
            current_delay_minutes=pos["current_delay_minutes"],
            timestamp=datetime.datetime.utcnow()
        )
        db.add(tp)

        if t_data["event"]:
            ev = t_data["event"]
            op_event = OperationalEvent(
                event_id=f"EVT_{train.train_number}_{int(datetime.datetime.utcnow().timestamp())}",
                train_id=train.train_id,
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
    db.close()
    print("Database seeding completed successfully with 8 trains.")

if __name__ == "__main__":
    seed_database(force_reseed=True)
