from pydantic import BaseModel
from datetime import datetime
from app.models.equipement import TypeEquipementEnum


class EquipementCreate(BaseModel):
    """Données pour créer un équipement dans l'inventaire"""
    nom: str
    type_equipement: TypeEquipementEnum
    site_id: int                          # Sur quel site se trouve cet équipement
    numero_serie: str | None = None
    marque: str | None = None
    modele: str | None = None
    description: str | None = None


class EquipementUpdate(BaseModel):
    """Données modifiables"""
    nom: str | None = None
    type_equipement: TypeEquipementEnum | None = None
    numero_serie: str | None = None
    marque: str | None = None
    modele: str | None = None
    description: str | None = None
    is_active: bool | None = None


class EquipementResponse(BaseModel):
    """Ce que l'API retourne"""
    id: int
    nom: str
    type_equipement: TypeEquipementEnum
    site_id: int
    numero_serie: str | None = None
    marque: str | None = None
    modele: str | None = None
    description: str | None = None
    is_active: bool
    created_at: datetime | None = None

    class Config:
        from_attributes = True
