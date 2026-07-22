from pydantic import BaseModel
from datetime import datetime


class SiteCreate(BaseModel):
    """Données pour créer un site"""
    nom: str
    marche_id: int          # Obligatoire : à quel marché appartient ce site
    adresse: str | None = None
    ville: str | None = None
    description: str | None = None


class SiteUpdate(BaseModel):
    """Données modifiables"""
    nom: str | None = None
    adresse: str | None = None
    ville: str | None = None
    description: str | None = None
    is_active: bool | None = None


class SiteResponse(BaseModel):
    """Ce que l'API retourne"""
    id: int
    nom: str
    marche_id: int
    adresse: str | None = None
    ville: str | None = None
    description: str | None = None
    is_active: bool
    created_at: datetime | None = None

    class Config:
        from_attributes = True
