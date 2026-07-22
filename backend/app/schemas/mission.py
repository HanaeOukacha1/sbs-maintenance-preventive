from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime
from app.models.mission import StatutMissionEnum


# ============================================================
# SCHÉMAS D'ENTRÉE (requêtes → API)
# ============================================================
class MissionCreate(BaseModel):
    titre: str
    description: Optional[str] = None
    date_planifiee: date
    technicien_id: int
    site_id: int
    json_schema_id: Optional[int] = None


class MissionUpdate(BaseModel):
    titre: Optional[str] = None
    description: Optional[str] = None
    date_planifiee: Optional[date] = None
    statut: Optional[StatutMissionEnum] = None
    technicien_id: Optional[int] = None
    site_id: Optional[int] = None
    json_schema_id: Optional[int] = None


# ============================================================
# SCHÉMAS DE SORTIE (API → réponse)
# ============================================================
class MissionResponse(BaseModel):
    id: int
    titre: str
    description: Optional[str] = None
    date_planifiee: date
    statut: StatutMissionEnum
    technicien_id: int
    site_id: int
    json_schema_id: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
