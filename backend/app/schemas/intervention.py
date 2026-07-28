from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime


class InterventionCreate(BaseModel):
    """
    Données envoyées par l'application mobile lors de la synchronisation.

    reponses (JSON flexible) selon le marché :
    - ADM     : {"etat_software": "OK", "etat_hardware": "Non"}
    - ANCFCC  : {"points": [{"num": 1, "reponse": "oui", "observation": "..."}, ...]}
    - Standard: {"observation": "BON"} ou {"etat": "OK"}
    - AMEE MàJ: {"nettoyage_disque": "OK", "fichiers_temp": "OK", "maj_windows": "OK"}
    """
    mission_id: int
    equipement_id: Optional[int] = None
    json_schema_id: Optional[int] = None

    # Onglet/feuille pour sites multi-feuilles (ex: "PC", "Serveurs", "SIEGE")
    feuille: Optional[str] = None

    # Réponses du technicien (JSON flexible)
    reponses: Optional[Dict[str, Any]] = None
    observations: Optional[str] = None

    # Équipement hors-inventaire ajouté sur site
    est_hors_inventaire: bool = False
    equipement_hors_inventaire: Optional[Dict[str, Any]] = None

    # Signatures (base64)
    signature_technicien: Optional[str] = None
    signature_client: Optional[str] = None
    signature_utilisateur: Optional[str] = None

    # Horodatage
    heure_debut: Optional[datetime] = None
    heure_fin: Optional[datetime] = None
    date_intervention: Optional[datetime] = None


class InterventionUpdate(BaseModel):
    """Pour la modification éventuelle par un superviseur"""
    feuille: Optional[str] = None
    reponses: Optional[Dict[str, Any]] = None
    observations: Optional[str] = None
    est_hors_inventaire: Optional[bool] = None
    equipement_hors_inventaire: Optional[Dict[str, Any]] = None
    signature_technicien: Optional[str] = None
    signature_client: Optional[str] = None
    signature_utilisateur: Optional[str] = None


class InterventionResponse(BaseModel):
    id: int
    mission_id: int
    equipement_id: Optional[int] = None
    json_schema_id: Optional[int] = None
    feuille: Optional[str] = None
    reponses: Optional[Dict[str, Any]] = None
    observations: Optional[str] = None
    est_hors_inventaire: bool
    equipement_hors_inventaire: Optional[Dict[str, Any]] = None
    signature_technicien: Optional[str] = None
    signature_client: Optional[str] = None
    signature_utilisateur: Optional[str] = None
    sync_en_attente: bool
    heure_debut: Optional[datetime] = None
    heure_fin: Optional[datetime] = None
    date_intervention: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
