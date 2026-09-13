import os
from pathlib import Path
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
ML_DIR = BASE_DIR / "ml"
SAVED_MODELS_DIR = ML_DIR / "saved_models"

class Settings(BaseModel):
    PROJECT_NAME: str = "Rail ETA Intelligence Platform (SIH26028)"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # Database - easily swappable for PostgreSQL via DATABASE_URL env var
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        f"sqlite:///{BASE_DIR}/rail_eta.db"
    )
    
    # Model paths
    MODEL_PATH: str = str(SAVED_MODELS_DIR / "eta_model.joblib")
    METRICS_PATH: str = str(SAVED_MODELS_DIR / "model_metrics.json")
    SYNTHETIC_DATA_PATH: str = str(DATA_DIR / "synthetic" / "train_sections_data.csv")
    
    # Simulation settings
    SIMULATION_INTERVAL_SECONDS: float = 2.5
    SIMULATION_STEP_MINUTES: int = 15
    
    # CORS
    CORS_ORIGINS: list[str] = ["*"]

settings = Settings()
