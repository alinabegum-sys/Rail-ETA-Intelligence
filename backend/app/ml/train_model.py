import json
import datetime
from pathlib import Path
import numpy as np
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from app.config import settings
from app.ml.dataset_generator import generate_synthetic_section_dataset

FEATURE_COLUMNS = [
    "current_delay",
    "current_speed",
    "distance_to_next",
    "historical_section_time",
    "historical_delay",
    "dwell_time",
    "remaining_stops",
    "time_of_day_hour",
    "day_of_week",
    "congestion_level",
    "event_severity",
    "speed_restriction",
    "weather_severity",
    "rainfall",
    "visibility",
    "preceding_train_delay"
]

TARGET_COLUMN = "additional_delay"

def train_and_evaluate_model():
    data_path = Path(settings.SYNTHETIC_DATA_PATH)
    if not data_path.exists():
        print("Generating synthetic dataset first...")
        df = generate_synthetic_section_dataset()
    else:
        df = pd.read_csv(data_path)

    print(f"Loaded dataset with {len(df)} samples.")
    X = df[FEATURE_COLUMNS]
    y = df[TARGET_COLUMN]

    # Train / Test split (80/20)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42
    )

    # 1. Evaluate Baseline Model:
    # Baseline assumes static propagation (additional_delay = 0, train maintains existing delay)
    baseline_preds = np.zeros_like(y_test)
    baseline_mae = float(mean_absolute_error(y_test, baseline_preds))
    baseline_rmse = float(np.sqrt(mean_squared_error(y_test, baseline_preds)))
    baseline_r2 = float(r2_score(y_test, baseline_preds))
    print(f"\n--- Baseline Model Metrics (Static ETA) ---")
    print(f"MAE:  {baseline_mae:.2f} mins")
    print(f"RMSE: {baseline_rmse:.2f} mins")
    print(f"R²:   {baseline_r2:.3f}")

    # 2. Train ML Model: RandomForestRegressor
    print(f"\nTraining RandomForestRegressor model on {len(X_train)} samples...")
    model = RandomForestRegressor(
        n_estimators=100,
        max_depth=14,
        min_samples_split=4,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1
    )
    model.fit(X_train, y_train)

    # 3. Evaluate ML Model on Holdout Test Set
    ml_preds = model.predict(X_test)
    ml_mae = float(mean_absolute_error(y_test, ml_preds))
    ml_rmse = float(np.sqrt(mean_squared_error(y_test, ml_preds)))
    ml_r2 = float(r2_score(y_test, ml_preds))

    improvement_pct = float(((baseline_mae - ml_mae) / baseline_mae) * 100.0) if baseline_mae > 0 else 0.0

    print(f"\n--- ML RandomForest Model Metrics ---")
    print(f"MAE:  {ml_mae:.2f} mins")
    print(f"RMSE: {ml_rmse:.2f} mins")
    print(f"R²:   {ml_r2:.3f}")
    print(f"Improvement over Baseline: {improvement_pct:.1f}% error reduction")

    # 4. Feature Importances
    importances = model.feature_importances_
    feat_imp_dict = {
        feat: round(float(imp), 4)
        for feat, imp in sorted(zip(FEATURE_COLUMNS, importances), key=lambda x: x[1], reverse=True)
    }

    # 5. Save Model artifact
    model_path = Path(settings.MODEL_PATH)
    model_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, model_path)
    print(f"\nTrained model persisted to {model_path}")

    # 6. Save genuine evaluation metrics
    metrics_payload = {
        "model_name": "RandomForestRegressor",
        "model_version": "v1.0-rf",
        "dataset_samples": len(df),
        "train_test_split": "80/20 (Holdout Evaluation)",
        "features": FEATURE_COLUMNS,
        "baseline_mae": round(baseline_mae, 2),
        "baseline_rmse": round(baseline_rmse, 2),
        "baseline_r2": round(baseline_r2, 3),
        "ml_mae": round(ml_mae, 2),
        "ml_rmse": round(ml_rmse, 2),
        "ml_r2": round(ml_r2, 3),
        "improvement_percent": round(improvement_pct, 1),
        "feature_importances": feat_imp_dict,
        "trained_at": datetime.datetime.utcnow().isoformat() + "Z"
    }

    metrics_path = Path(settings.METRICS_PATH)
    with open(metrics_path, "w") as f:
        json.dump(metrics_payload, f, indent=2)
    print(f"Metrics saved to {metrics_path}")

    return model, metrics_payload

if __name__ == "__main__":
    train_and_evaluate_model()
