import datetime
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Text
)
from sqlalchemy.orm import relationship
from app.database.session import Base

class Train(Base):
    __tablename__ = "trains"

    train_id = Column(String(32), primary_key=True, index=True)
    train_number = Column(String(16), unique=True, index=True, nullable=False)
    train_name = Column(String(128), nullable=False)
    train_type = Column(String(64), nullable=False)  # Rajdhani, Shatabdi, Vande Bharat, Superfast, Mail
    source = Column(String(64), nullable=False)
    destination = Column(String(64), nullable=False)
    total_distance = Column(Float, nullable=False)  # km
    scheduled_start = Column(String(16), nullable=False)  # HH:MM
    is_active = Column(Boolean, default=True)

    # Relationships
    stops = relationship("TrainStop", back_populates="train", order_by="TrainStop.sequence", cascade="all, delete-orphan")
    positions = relationship("TrainPosition", back_populates="train", cascade="all, delete-orphan")
    events = relationship("OperationalEvent", back_populates="train", cascade="all, delete-orphan")
    predictions = relationship("Prediction", back_populates="train", cascade="all, delete-orphan")


class Station(Base):
    __tablename__ = "stations"

    station_id = Column(String(32), primary_key=True, index=True)
    station_code = Column(String(16), unique=True, index=True, nullable=False)
    station_name = Column(String(128), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)

    # Relationships
    stops = relationship("TrainStop", back_populates="station")


class TrainStop(Base):
    __tablename__ = "train_stops"

    id = Column(Integer, primary_key=True, autoincrement=True)
    train_id = Column(String(32), ForeignKey("trains.train_id"), nullable=False, index=True)
    station_id = Column(String(32), ForeignKey("stations.station_id"), nullable=False, index=True)
    sequence = Column(Integer, nullable=False)
    scheduled_arrival = Column(String(16), nullable=False)  # HH:MM or "Source"
    scheduled_departure = Column(String(16), nullable=False)  # HH:MM or "Terminus"
    historical_dwell_minutes = Column(Float, default=2.0)
    distance_from_source = Column(Float, default=0.0)

    # Relationships
    train = relationship("Train", back_populates="stops")
    station = relationship("Station", back_populates="stops")


class TrainPosition(Base):
    __tablename__ = "train_positions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    train_id = Column(String(32), ForeignKey("trains.train_id"), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    current_station = Column(String(64), nullable=True)
    next_station = Column(String(64), nullable=False)
    speed = Column(Float, default=0.0)  # km/h
    current_delay_minutes = Column(Float, default=0.0)

    # Relationships
    train = relationship("Train", back_populates="positions")


class OperationalEvent(Base):
    __tablename__ = "operational_events"

    event_id = Column(String(64), primary_key=True, index=True)
    train_id = Column(String(32), ForeignKey("trains.train_id"), nullable=False, index=True)
    event_type = Column(String(64), nullable=False)  # Signal Delay, Speed Restriction, Congestion, etc.
    severity = Column(String(32), default="Moderate")  # Minor, Moderate, Major, Critical
    duration_minutes = Column(Float, default=15.0)
    location = Column(String(128), nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)

    # Relationships
    train = relationship("Train", back_populates="events")


class Weather(Base):
    __tablename__ = "weather"

    id = Column(Integer, primary_key=True, autoincrement=True)
    location = Column(String(64), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    temperature = Column(Float, default=28.0)  # Celsius
    rainfall = Column(Float, default=0.0)  # mm/hr
    visibility = Column(Float, default=10.0)  # km
    weather_severity = Column(String(32), default="Clear")  # Clear, Foggy, Rainy, Severe Storm


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    train_id = Column(String(32), ForeignKey("trains.train_id"), nullable=False, index=True)
    station_id = Column(String(32), ForeignKey("stations.station_id"), nullable=False, index=True)
    prediction_timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    baseline_eta = Column(String(16), nullable=False)
    predicted_eta = Column(String(16), nullable=False)
    predicted_delay = Column(Float, nullable=False)
    confidence = Column(Float, nullable=False)  # 0.0 to 1.0
    model_version = Column(String(32), default="v1.0-rf")

    # Relationships
    train = relationship("Train", back_populates="predictions")
