from pydantic import BaseModel
from typing import Any, Dict, Optional
from datetime import datetime


# ============================================================
# SCHÉMAS D'ENTRÉE (requêtes → API)
# ============================================================
class JsonSchemaCreate(BaseModel):
    nom: str
    type_equipement: str
    schema_data: Any
    marche_id: Optional[int] = None
    site_id: Optional[int] = None
    description: Optional[str] = None


class JsonSchemaUpdate(BaseModel):
    nom: Optional[str] = None
    type_equipement: Optional[str] = None
    schema_data: Optional[Any] = None
    marche_id: Optional[int] = None
    site_id: Optional[int] = None
    is_active: Optional[bool] = None
    description: Optional[str] = None


# ============================================================
# SCHÉMAS DE SORTIE (API → réponse)
# ============================================================
class JsonSchemaResponse(BaseModel):
    id: int
    nom: str
    type_equipement: str
    version: int
    schema_data: Any
    marche_id: Optional[int] = None
    site_id: Optional[int] = None
    is_active: bool
    description: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
