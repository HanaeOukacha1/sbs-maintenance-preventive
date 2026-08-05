from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.models.intervention import Intervention
from app.models.mission import Mission, StatutMissionEnum
from app.models.user import User, RoleEnum
from app.schemas.intervention import InterventionCreate, InterventionUpdate, InterventionResponse
from app.core.dependencies import get_current_user, require_role

# ============================================================
# ROUTER INTERVENTIONS
# ============================================================
# Gestion des données de l'audit envoyées par les techniciens.
# ============================================================
router = APIRouter(prefix="/interventions", tags=["Interventions"])


@router.get("/", response_model=List[InterventionResponse])
def liste_interventions(
    skip: int = 0,
    limit: int = 100,
    mission_id: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retourne la liste des interventions (formulaires remplis).
    Possibilité de filtrer par mission_id.
    - TECHNICIEN : voit uniquement les interventions de ses missions.
    - ADMIN/SUPERVISEUR : voient tout.
    """
    query = db.query(Intervention)

    if mission_id:
        query = query.filter(Intervention.mission_id == mission_id)

    if current_user.role == RoleEnum.TECHNICIEN:
        # Jointure avec la table Mission pour vérifier l'appartenance
        query = query.join(Mission).filter(Mission.technicien_id == current_user.id)

    interventions = query.offset(skip).limit(limit).all()
    return interventions


@router.post("/", response_model=InterventionResponse, status_code=status.HTTP_201_CREATED)
def soumettre_intervention(
    payload: InterventionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.ADMIN, RoleEnum.SUPERVISEUR, RoleEnum.TECHNICIEN))
):
    """
    Soumission d'un formulaire rempli (généralement appelé par l'app Mobile).
    L'intervention est enregistrée et la mission liée peut être mise à jour.
    """
    # Vérifier que la mission existe
    mission = db.query(Mission).filter(Mission.id == payload.mission_id).first()
    if not mission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Mission avec l'id {payload.mission_id} introuvable."
        )

    # Si c'est un technicien, vérifier qu'il est bien assigné à la mission
    if current_user.role == RoleEnum.TECHNICIEN and mission.technicien_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'êtes pas assigné à cette mission."
        )

    # Création de l'intervention
    intervention = Intervention(
        mission_id=payload.mission_id,
        equipement_id=payload.equipement_id,
        json_schema_id=payload.json_schema_id,
        feuille=payload.feuille,
        reponses=payload.reponses,
        observations=payload.observations,
        est_hors_inventaire=payload.est_hors_inventaire,
        equipement_hors_inventaire=payload.equipement_hors_inventaire,
        signature_technicien=payload.signature_technicien,
        signature_client=payload.signature_client,
        signature_utilisateur=payload.signature_utilisateur,
        heure_debut=payload.heure_debut,
        heure_fin=payload.heure_fin,
        date_intervention=payload.date_intervention,
        sync_en_attente=False
    )
    db.add(intervention)

    db.commit()
    db.refresh(intervention)
    return intervention


@router.get("/{intervention_id}", response_model=InterventionResponse)
def get_intervention(
    intervention_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Récupère une intervention spécifique.
    """
    intervention = db.query(Intervention).filter(Intervention.id == intervention_id).first()
    if not intervention:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Intervention avec l'id {intervention_id} introuvable."
        )

    # Vérifier les droits du technicien
    if current_user.role == RoleEnum.TECHNICIEN:
        mission = db.query(Mission).filter(Mission.id == intervention.mission_id).first()
        if mission.technicien_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Accès refusé."
            )

    return intervention


@router.put("/{intervention_id}", response_model=InterventionResponse)
def modifier_intervention(
    intervention_id: int,
    payload: InterventionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.ADMIN, RoleEnum.SUPERVISEUR))
):
    """
    Modifie le contenu d'une intervention (Correction d'une erreur par le superviseur).
    Accessible par : ADMIN, SUPERVISEUR
    """
    intervention = db.query(Intervention).filter(Intervention.id == intervention_id).first()
    if not intervention:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Intervention avec l'id {intervention_id} introuvable."
        )

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(intervention, field, value)

    db.commit()
    db.refresh(intervention)
    return intervention


@router.delete("/{intervention_id}", status_code=status.HTTP_200_OK)
def supprimer_intervention(
    intervention_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.ADMIN))
):
    """
    Supprime une intervention.
    Accessible par : ADMIN uniquement.
    """
    intervention = db.query(Intervention).filter(Intervention.id == intervention_id).first()
    if not intervention:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Intervention avec l'id {intervention_id} introuvable."
        )

    db.delete(intervention)
    db.commit()
    return {"message": "Intervention supprimée avec succès."}
