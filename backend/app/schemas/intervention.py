from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime


# ============================================================
# SCHÉMAS D'ENTRÉE (requêtes → API)
# ============================================================
class InterventionCreate(BaseModel):
    """
    Données envoyées par l'application mobile lors de la synchronisation
    (ou par le frontend web si saisie manuelle)
    """
    mission_id: int
    equipement_id: Optional[int] = None
    json_schema_id: Optional[int] = None
    reponses: Optional[Dict[str, Any]] = None
    observations: Optional[str] = None
    est_hors_inventaire: bool = False
    numero_serie_saisi: Optional[str] = None
    date_intervention: Optional[datetime] = None


class InterventionUpdate(BaseModel):
    """
    Pour la modification éventuelle d'une intervention par un superviseur
    """
    reponses: Optional[Dict[str, Any]] = None
    observations: Optional[str] = None
    est_hors_inventaire: Optional[bool] = None
    numero_serie_saisi: Optional[str] = None


# ============================================================
# SCHÉMAS DE SORTIE (API → réponse)
# ============================================================
class InterventionResponse(BaseModel):
    id: int
    mission_id: int
    equipement_id: Optional[int] = None
    json_schema_id: Optional[int] = None
    reponses: Optional[Dict[str, Any]] = None
    observations: Optional[str] = None
    est_hors_inventaire: bool
    numero_serie_saisi: Optional[str] = None
    sync_en_attente: bool
    date_intervention: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
