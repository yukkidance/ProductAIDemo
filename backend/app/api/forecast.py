from fastapi import APIRouter
from pydantic import BaseModel
from app.services.forecast_service import forecast_service

router = APIRouter()


class PredictRequest(BaseModel):
    part_type: str = "consumable"          # safety | consumable
    aircraft_model: str = "A320"
    month: int = 6
    check_plan: int = 1                    # 0-4
    season_factor: float = 1.0
    historical_avg: float = 100.0


@router.post("/predict")
async def predict(req: PredictRequest):
    return forecast_service.predict(req.model_dump())


@router.get("/health")
async def health():
    return {"status": "ok", "module": "forecast", "loaded": forecast_service.is_loaded()}
