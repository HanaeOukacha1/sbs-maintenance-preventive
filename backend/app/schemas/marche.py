from pydantic import BaseModel
from datetime import datetime


class MarcheCreate(BaseModel):
    """Données pour créer un marché"""
    nom: str
    client: str
    description: str | None = None
    numero: str | None = None
    informations_entete: str | None = None


class MarcheUpdate(BaseModel):
    """Données modifiables (tous optionnels)"""
    nom: str | None = None
    client: str | None = None
    description: str | None = None
    is_active: bool | None = None
    numero: str | None = None
    informations_entete: str | None = None


class MarcheResponse(BaseModel):
    """Ce que l'API retourne"""
    id: int
    nom: str
    client: str
    description: str | None = None
    is_active: bool
    numero: str | None = None
    informations_entete: str | None = None
    logo_url: str | None = None
    created_at: datetime | None = None

    class Config:
        from_attributes = True
