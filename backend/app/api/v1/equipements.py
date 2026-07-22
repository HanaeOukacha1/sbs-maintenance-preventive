from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.models.equipement import Equipement
from app.models.site import Site
from app.models.user import RoleEnum
from app.schemas.equipement import EquipementCreate, EquipementUpdate, EquipementResponse
from app.core.dependencies import require_role

router = APIRouter(prefix="/equipements", tags=["Équipements"])

all_roles = require_role(RoleEnum.ADMIN, RoleEnum.SUPERVISEUR, RoleEnum.TECHNICIEN)
admin_or_superviseur = require_role(RoleEnum.ADMIN, RoleEnum.SUPERVISEUR)


@router.post("/", response_model=EquipementResponse, status_code=201)
def create_equipement(data: EquipementCreate, db: Session = Depends(get_db), _=Depends(admin_or_superviseur)):
    """Ajouter un équipement à l'inventaire d'un site"""
    # Vérifier que le site existe
    site = db.query(Site).filter(Site.id == data.site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail=f"Site ID {data.site_id} introuvable")

    equipement = Equipement(**data.model_dump())
    db.add(equipement)
    db.commit()
    db.refresh(equipement)
    return equipement


@router.get("/", response_model=List[EquipementResponse])
def list_equipements(site_id: int | None = None, db: Session = Depends(get_db), _=Depends(all_roles)):
    """
    Lister les équipements (filtrable par site).
    Utilisé par le mobile lors de la synchronisation initiale
    pour télécharger l'inventaire du site cible.
    """
    query = db.query(Equipement).filter(Equipement.is_active == True)
    if site_id:
        query = query.filter(Equipement.site_id == site_id)
    return query.all()


@router.get("/{equipement_id}", response_model=EquipementResponse)
def get_equipement(equipement_id: int, db: Session = Depends(get_db), _=Depends(all_roles)):
    """Récupérer un équipement par son ID"""
    eq = db.query(Equipement).filter(Equipement.id == equipement_id).first()
    if not eq:
        raise HTTPException(status_code=404, detail="Équipement introuvable")
    return eq


@router.get("/recherche/serie/{numero_serie}", response_model=EquipementResponse | None)
def rechercher_par_serie(numero_serie: str, db: Session = Depends(get_db), _=Depends(all_roles)):
    """
    Rechercher un équipement par numéro de série.
    Utilisé par le mobile pour le contrôle croisé de l'inventaire
    (surbrillance verte si trouvé).
    """
    eq = db.query(Equipement).filter(
        Equipement.numero_serie == numero_serie,
        Equipement.is_active == True
    ).first()
    return eq  # Retourne None si non trouvé (mobile affiche en rouge)


@router.put("/{equipement_id}", response_model=EquipementResponse)
def update_equipement(equipement_id: int, data: EquipementUpdate, db: Session = Depends(get_db), _=Depends(admin_or_superviseur)):
    """Modifier un équipement"""
    eq = db.query(Equipement).filter(Equipement.id == equipement_id).first()
    if not eq:
        raise HTTPException(status_code=404, detail="Équipement introuvable")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(eq, field, value)
    db.commit()
    db.refresh(eq)
    return eq


@router.delete("/{equipement_id}", status_code=204)
def delete_equipement(equipement_id: int, db: Session = Depends(get_db), _=Depends(require_role(RoleEnum.ADMIN))):
    """Supprimer un équipement (Admin uniquement)"""
    eq = db.query(Equipement).filter(Equipement.id == equipement_id).first()
    if not eq:
        raise HTTPException(status_code=404, detail="Équipement introuvable")
    db.delete(eq)
    db.commit()
