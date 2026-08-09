from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Any
from app.models.site import ChecklistTypeEnum


class SiteCreate(BaseModel):
    """Données pour créer un site"""
    nom: str
    marche_id: int
    adresse: Optional[str] = None
    ville: Optional[str] = None
    description: Optional[str] = None
    checklist_type: Optional[str] = None
    feuilles: Optional[List[str]] = None   # ex: ["PC", "MàJ Windows", "Imp & MFP", "Data Center"]


class SiteUpdate(BaseModel):
    """Données modifiables"""
    nom: Optional[str] = None
    adresse: Optional[str] = None
    ville: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    checklist_type: Optional[str] = None
    feuilles: Optional[List[str]] = None


class SiteResponse(BaseModel):
    """Ce que l'API retourne"""
    id: int
    nom: str
    marche_id: int
    adresse: Optional[str] = None
    ville: Optional[str] = None
    description: Optional[str] = None
    is_active: bool
    checklist_type: Optional[str] = None
    feuilles: Optional[List[str]] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
