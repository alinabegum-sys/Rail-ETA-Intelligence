from pathlib import Path
import joblib
import numpy as np
import pandas as pd
from app.config import settings
from app.ml.train_model import FEATURE_COLUMNS, train_and_evaluate_model

class MLPredictor:
    _instance = None
    _model = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
            cls._instance._load_or_train()
        return cls._instance

    def _load_or_train(self):
        model_path = Path(settings.MODEL_PATH)
        if not model_path.exists():
            print("Trained model not found. Training new model now...")
            self._model, _ = train_and_evaluate_model()
        else:
            self._model = joblib.load(model_path)
            print("Loaded trained RandomForestRegressor from disk.")

    def predict_section_delay(self, features: dict) -> tuple[float, float]:
        """
        Predicts additional delay for a section and returns (predicted_additional_delay, confidence).
        Confidence is derived from variance across tree estimators.
        """
        df_input = pd.DataFrame([features])[FEATURE_COLUMNS]
        
        # Aggregate prediction from trees
        all_tree_preds = np.array([tree.predict(df_input.values)[0] for tree in self._model.estimators_])
        mean_pred = float(np.mean(all_tree_preds))
        std_pred = float(np.std(all_tree_preds))
        
        # Calibrate confidence score between 0.60 and 0.98
        # Higher variance across trees = lower confidence
        raw_conf = 1.0 - (std_pred / 15.0)
        confidence = float(np.clip(raw_conf, 0.55, 0.97))
        
        return round(mean_pred, 1), round(confidence, 2)

predictor = MLPredictor.get_instance()
