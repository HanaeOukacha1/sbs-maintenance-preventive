from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.models.site import Site
from app.models.marche import Marche
from app.models.user import RoleEnum
from app.schemas.site import SiteCreate, SiteUpdate, SiteResponse
from app.core.dependencies import require_role

router = APIRouter(prefix="/sites", tags=["Sites"])

all_roles = require_role(RoleEnum.ADMIN, RoleEnum.SUPERVISEUR, RoleEnum.TECHNICIEN)
admin_or_superviseur = require_role(RoleEnum.ADMIN, RoleEnum.SUPERVISEUR)


@router.post("/", response_model=SiteResponse, status_code=201)
def create_site(data: SiteCreate, db: Session = Depends(get_db), _=Depends(admin_or_superviseur)):
    """Créer un site rattaché à un marché"""
    # Vérifier que le marché parent existe
    marche = db.query(Marche).filter(Marche.id == data.marche_id).first()
    if not marche:
        raise HTTPException(status_code=404, detail=f"Marché ID {data.marche_id} introuvable")

    site = Site(**data.model_dump())
    db.add(site)
    db.commit()
    db.refresh(site)
    return site


@router.get("/", response_model=List[SiteResponse])
def list_sites(marche_id: int | None = None, db: Session = Depends(get_db), _=Depends(all_roles)):
    """Lister les sites (filtrable par marché)"""
    query = db.query(Site).filter(Site.is_active == True)
    if marche_id:
        query = query.filter(Site.marche_id == marche_id)
    return query.all()


@router.get("/{site_id}", response_model=SiteResponse)
def get_site(site_id: int, db: Session = Depends(get_db), _=Depends(all_roles)):
    """Récupérer un site par son ID"""
    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site introuvable")
    return site


@router.put("/{site_id}", response_model=SiteResponse)
def update_site(site_id: int, data: SiteUpdate, db: Session = Depends(get_db), _=Depends(admin_or_superviseur)):
    """Modifier un site"""
    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site introuvable")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(site, field, value)
    db.commit()
    db.refresh(site)
    return site


@router.delete("/{site_id}", status_code=204)
def delete_site(site_id: int, db: Session = Depends(get_db), _=Depends(require_role(RoleEnum.ADMIN))):
    """Supprimer un site (Admin uniquement)"""
    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site introuvable")
    db.delete(site)
    db.commit()
