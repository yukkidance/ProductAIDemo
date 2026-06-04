import json
import os
import numpy as np
import xgboost as xgb
from app.core.config import settings


class ForecastService:
    """XGBoost 时序预测 - 加载原生 JSON 模型推理(无 joblib/pandas)"""

    def __init__(self):
        self.model = None
        self.meta = None
        self._loaded = False

    def _load(self):
        if self._loaded:
            return
        model_path = settings.FORECAST_MODEL_PATH
        meta_path = os.path.join(os.path.dirname(model_path), "forecast_meta.json")
        if not (os.path.exists(model_path) and os.path.exists(meta_path)):
            return
        self.model = xgb.Booster()
        self.model.load_model(model_path)
        with open(meta_path, "r", encoding="utf-8") as f:
            self.meta = json.load(f)
        self._loaded = True

    def is_loaded(self):
        return self._loaded

    def _build_features(self, payload: dict) -> np.ndarray:
        """手工 one-hot + 数值拼接,无 pandas 依赖"""
        cols = self.meta["feature_columns"]
        cat_vals = self.meta["categorical_values"]
        fv = {c: 0.0 for c in cols}
        for c in ["month", "check_plan", "season_factor", "historical_avg"]:
            fv[c] = float(payload.get(c, 0))
        pt = payload.get("part_type", "")
        for v in cat_vals["part_type"]:
            key = f"part_type_{v}"
            if key in fv:
                fv[key] = 1.0 if pt == v else 0.0
        am = payload.get("aircraft_model", "")
        for v in cat_vals["aircraft_model"]:
            key = f"aircraft_model_{v}"
            if key in fv:
                fv[key] = 1.0 if am == v else 0.0
        return np.array([[fv[c] for c in cols]], dtype=np.float32)

    def predict(self, payload: dict) -> dict:
        self._load()
        if not self._loaded:
            return {
                "error": "模型未加载,请先运行 scripts/train_forecast_model.py",
                "loaded": False,
            }
        X = self._build_features(payload)
        y_pred = float(self.model.predict(xgb.DMatrix(X))[0])
        y_pred = max(0, round(y_pred, 2))

        if payload.get("part_type") == "safety":
            strategy = "安全件-零漏报优先"
            note = "宁可多备,不可漏报;关注 P99 上限"
        else:
            strategy = "消耗件-误报率控制"
            note = "控制过量备库;关注 P50 中位数"

        raw_imp = self.model.get_score(importance_type="gain")
        feature_columns = self.meta["feature_columns"]
        imp_list = []
        for i, col in enumerate(feature_columns):
            key = f"f{i}"
            imp_list.append({"name": col, "importance": float(raw_imp.get(key, 0.0))})
        top_features = [
            {"name": f["name"], "importance": round(f["importance"], 4)}
            for f in sorted(imp_list, key=lambda x: -x["importance"])[:5]
        ]

        return {
            "success": True,
            "predicted_demand": y_pred,
            "lower_bound": round(y_pred * 0.85, 2),
            "upper_bound": round(y_pred * 1.15, 2),
            "evaluation_strategy": strategy,
            "note": note,
            "top_features": top_features,
            "input": payload,
        }


forecast_service = ForecastService()
