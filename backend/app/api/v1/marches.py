from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.models.marche import Marche
from app.models.user import RoleEnum
from app.schemas.marche import MarcheCreate, MarcheUpdate, MarcheResponse
from app.core.dependencies import require_role

router = APIRouter(prefix="/marches", tags=["Marchés"])

# Raccourci : seuls Admin et Superviseur peuvent gérer les marchés
admin_or_superviseur = require_role(RoleEnum.ADMIN, RoleEnum.SUPERVISEUR)


@router.post("/", response_model=MarcheResponse, status_code=201)
def create_marche(
    data: MarcheCreate,
    db: Session = Depends(get_db),
    current_user=Depends(admin_or_superviseur)  # 🔒 Protégé
):
    """Créer un nouveau marché client"""
    # Vérifier qu'un marché avec ce nom n'existe pas déjà
    existing = db.query(Marche).filter(Marche.nom == data.nom).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Un marché avec le nom '{data.nom}' existe déjà."
        )

    marche = Marche(**data.model_dump())
    db.add(marche)
    db.commit()
    db.refresh(marche)  # Recharge depuis la BDD pour avoir l'id et created_at
    return marche


@router.get("/", response_model=List[MarcheResponse])
def list_marches(
    actifs_seulement: bool = True,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(RoleEnum.ADMIN, RoleEnum.SUPERVISEUR, RoleEnum.TECHNICIEN))
):
    """Lister tous les marchés (filtre optionnel : actifs seulement)"""
    query = db.query(Marche)
    if actifs_seulement:
        query = query.filter(Marche.is_active == True)
    return query.all()


@router.get("/{marche_id}", response_model=MarcheResponse)
def get_marche(
    marche_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(RoleEnum.ADMIN, RoleEnum.SUPERVISEUR, RoleEnum.TECHNICIEN))
):
    """Récupérer un marché par son ID"""
    marche = db.query(Marche).filter(Marche.id == marche_id).first()
    if not marche:
        raise HTTPException(status_code=404, detail="Marché introuvable")
    return marche


@router.put("/{marche_id}", response_model=MarcheResponse)
def update_marche(
    marche_id: int,
    data: MarcheUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(admin_or_superviseur)  # 🔒 Protégé
):
    """Modifier un marché existant"""
    marche = db.query(Marche).filter(Marche.id == marche_id).first()
    if not marche:
        raise HTTPException(status_code=404, detail="Marché introuvable")

    # Met à jour seulement les champs envoyés (exclude_unset=True)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(marche, field, value)

    db.commit()
    db.refresh(marche)
    return marche


@router.delete("/{marche_id}", status_code=204)
def delete_marche(
    marche_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(RoleEnum.ADMIN))  # 🔒 Admin seulement
):
    """Supprimer un marché (Admin uniquement)"""
    marche = db.query(Marche).filter(Marche.id == marche_id).first()
    if not marche:
        raise HTTPException(status_code=404, detail="Marché introuvable")

    db.delete(marche)
    db.commit()
