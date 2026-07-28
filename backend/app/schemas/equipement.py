from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Any
from app.models.equipement import TypeEquipementEnum


class EquipementCreate(BaseModel):
    """Données pour créer un équipement dans l'inventaire"""
    nom: str
    type_equipement: TypeEquipementEnum = TypeEquipementEnum.AUTRE
    site_id: int

    # Identification
    numero_serie: str  # Rendu obligatoire
    numero_inventaire: Optional[str] = None
    designation: Optional[str] = None
    famille: Optional[str] = None
    marque: Optional[str] = None
    modele: Optional[str] = None

    # Localisation
    direction: Optional[str] = None
    bureau: Optional[str] = None
    emplacement: Optional[str] = None
    affectation: Optional[str] = None
    entite: Optional[str] = None
    utilisateur_nom: Optional[str] = None
    sous_site: Optional[str] = None

    # Specs techniques
    cpu: Optional[str] = None
    ram: Optional[str] = None
    disque_dur: Optional[str] = None
    systeme_exploitation: Optional[str] = None
    stockage_utilise: Optional[str] = None
    antivirus: Optional[str] = None
    ip: Optional[str] = None

    # ADM : paires serveur
    est_serveur_redondant: bool = False
    serveur_principal_id: Optional[int] = None

    # ANCFCC : onduleur
    puissance_kva: Optional[str] = None
    nb_batteries: Optional[int] = None
    capacite_batteries: Optional[str] = None
    zone: Optional[str] = None

    description: Optional[str] = None


class EquipementUpdate(BaseModel):
    """Données modifiables"""
    nom: Optional[str] = None
    type_equipement: Optional[TypeEquipementEnum] = None
    numero_serie: Optional[str] = None
    numero_inventaire: Optional[str] = None
    designation: Optional[str] = None
    famille: Optional[str] = None
    marque: Optional[str] = None
    modele: Optional[str] = None
    direction: Optional[str] = None
    bureau: Optional[str] = None
    emplacement: Optional[str] = None
    affectation: Optional[str] = None
    entite: Optional[str] = None
    utilisateur_nom: Optional[str] = None
    sous_site: Optional[str] = None
    cpu: Optional[str] = None
    ram: Optional[str] = None
    disque_dur: Optional[str] = None
    systeme_exploitation: Optional[str] = None
    stockage_utilise: Optional[str] = None
    antivirus: Optional[str] = None
    ip: Optional[str] = None
    puissance_kva: Optional[str] = None
    nb_batteries: Optional[int] = None
    capacite_batteries: Optional[str] = None
    zone: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class EquipementResponse(BaseModel):
    """Ce que l'API retourne — tous les champs pour l'app mobile"""
    id: int
    nom: str
    type_equipement: TypeEquipementEnum
    site_id: int
    is_active: bool

    # Identification
    numero_serie: Optional[str] = None
    numero_inventaire: Optional[str] = None
    designation: Optional[str] = None
    famille: Optional[str] = None
    marque: Optional[str] = None
    modele: Optional[str] = None

    # Localisation
    direction: Optional[str] = None
    bureau: Optional[str] = None
    emplacement: Optional[str] = None
    affectation: Optional[str] = None
    entite: Optional[str] = None
    utilisateur_nom: Optional[str] = None
    sous_site: Optional[str] = None

    # Specs
    cpu: Optional[str] = None
    ram: Optional[str] = None
    disque_dur: Optional[str] = None
    systeme_exploitation: Optional[str] = None
    stockage_utilise: Optional[str] = None
    antivirus: Optional[str] = None
    ip: Optional[str] = None

    # ADM
    est_serveur_redondant: bool = False
    serveur_principal_id: Optional[int] = None

    # ANCFCC
    puissance_kva: Optional[str] = None
    nb_batteries: Optional[int] = None
    capacite_batteries: Optional[str] = None
    zone: Optional[str] = None

    description: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
