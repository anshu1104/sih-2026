from fastapi import APIRouter
import json
import os
from pydantic import BaseModel

router = APIRouter()
SETTINGS_FILE = "settings.json"

class SettingsModel(BaseModel):
    defaultPriority: str
    requireLocation: bool
    requireImage: bool

DEFAULT_SETTINGS = {
    "defaultPriority": "High",
    "requireLocation": True,
    "requireImage": True
}

@router.get("/settings")
def get_settings():
    if not os.path.exists(SETTINGS_FILE):
        return DEFAULT_SETTINGS
    with open(SETTINGS_FILE, "r") as f:
        try:
            return json.load(f)
        except:
            return DEFAULT_SETTINGS

@router.post("/settings")
def update_settings(settings: SettingsModel):
    with open(SETTINGS_FILE, "w") as f:
        json.dump(settings.dict(), f)
    return {"status": "success", "settings": settings.dict()}
