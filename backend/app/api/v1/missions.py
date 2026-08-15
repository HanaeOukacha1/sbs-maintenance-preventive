from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.models.mission import Mission, StatutMissionEnum
from app.models.user import User, RoleEnum
from app.schemas.mission import MissionCreate, MissionUpdate, MissionResponse
from app.core.dependencies import get_current_user, require_role

# ============================================================
# ROUTER MISSIONS
# ============================================================
# Gestion des interventions (CRUD, assignation, changement de statut)
# ============================================================
router = APIRouter(prefix="/missions", tags=["Missions"])


@router.get("/", response_model=List[MissionResponse])
def liste_missions(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retourne la liste des missions.
    - Si ADMIN/SUPERVISEUR : voit toutes les missions
    - Si TECHNICIEN : voit uniquement SES missions assignÃ©es
    """
    query = db.query(Mission)
    
    # Filtrer pour le technicien
    if current_user.role == RoleEnum.TECHNICIEN:
        query = query.filter(Mission.technicien_id == current_user.id)
        
    missions = query.offset(skip).limit(limit).all()
    return missions


@router.post("/", response_model=MissionResponse, status_code=status.HTTP_201_CREATED)
def creer_mission(
    payload: MissionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.ADMIN, RoleEnum.SUPERVISEUR))
):
    """
    CrÃ©e une nouvelle mission (Planification).
    Accessible par : ADMIN, SUPERVISEUR
    """
    mission = Mission(
        titre=payload.titre,
        description=payload.description,
        date_planifiee=payload.date_planifiee,
        statut=StatutMissionEnum.PLANIFIEE,
        technicien_id=payload.technicien_id,
        site_id=payload.site_id,
        json_schema_id=payload.json_schema_id
    )
    db.add(mission)
    db.commit()
    db.refresh(mission)
    return mission


from app.models.site import Site
from app.models.equipement import Equipement
from app.models.json_schema import JsonSchema

@router.get("/sync-data")
def get_sync_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Missions
    missions_query = db.query(Mission)
    if current_user.role == RoleEnum.TECHNICIEN:
        missions_query = missions_query.filter(Mission.technicien_id == current_user.id)
    missions = missions_query.all()
    
    # 2. Sites concernés
    site_ids = list(set([m.site_id for m in missions if m.site_id]))
    sites = db.query(Site).filter(Site.id.in_(site_ids)).all() if site_ids else []
    
    # 3. Équipements de ces sites
    equipements = db.query(Equipement).filter(Equipement.site_id.in_(site_ids)).all() if site_ids else []
    
    # 4. JSON Schemas actifs
    json_schemas = db.query(JsonSchema).filter(JsonSchema.is_active == True).all()

    return {
        "missions": missions,
        "sites": sites,
        "equipements": equipements,
        "json_schemas": json_schemas
    }

@router.get("/{mission_id}", response_model=MissionResponse)
def get_mission(
    mission_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    RÃ©cupÃ¨re une mission par son ID.
    - TECHNICIEN : Ne peut voir que si Ã§a lui est assignÃ©
    """
    mission = db.query(Mission).filter(Mission.id == mission_id).first()
    if not mission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Mission avec l'id {mission_id} introuvable."
        )

    if current_user.role == RoleEnum.TECHNICIEN and mission.technicien_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="AccÃ¨s refusÃ©. Cette mission ne vous est pas assignÃ©e."
        )

    return mission


@router.put("/{mission_id}", response_model=MissionResponse)
def modifier_mission(
    mission_id: int,
    payload: MissionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Modifie une mission existante.
    - ADMIN/SUPERVISEUR : peuvent tout modifier.
    - TECHNICIEN : peut UNIQUEMENT modifier le 'statut' de la mission 
      (pour la passer en EN_COURS ou TERMINEE).
    """
    mission = db.query(Mission).filter(Mission.id == mission_id).first()
    if not mission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Mission avec l'id {mission_id} introuvable."
        )

    update_data = payload.model_dump(exclude_unset=True)

    # VÃ©rification des droits si c'est un TECHNICIEN
    if current_user.role == RoleEnum.TECHNICIEN:
        if mission.technicien_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="AccÃ¨s refusÃ©."
            )
        # Le technicien ne peut changer QUE le statut
        keys = list(update_data.keys())
        if keys != ["statut"] and keys != []:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Un technicien ne peut modifier que le statut de sa mission."
            )

    for field, value in update_data.items():
        setattr(mission, field, value)

    db.commit()
    db.refresh(mission)
    return mission


@router.delete("/{mission_id}", status_code=status.HTTP_200_OK)
def supprimer_mission(
    mission_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.ADMIN, RoleEnum.SUPERVISEUR))
):
    """
    Supprime dÃ©finitivement une mission.
    Accessible par : ADMIN, SUPERVISEUR
    """
    mission = db.query(Mission).filter(Mission.id == mission_id).first()
    if not mission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Mission avec l'id {mission_id} introuvable."
        )

    db.delete(mission)
    db.commit()
    return {"message": f"Mission '{mission.titre}' supprimÃ©e avec succÃ¨s."}


@router.get("/{mission_id}/export")
def exporter_rapport_mission(
    mission_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.ADMIN, RoleEnum.SUPERVISEUR, RoleEnum.TECHNICIEN))
):
    from fastapi.responses import StreamingResponse
    from app.services.export_service import exporter_mission
    from app.models.intervention import Intervention
    from app.models.equipement import Equipement

    mission = db.query(Mission).filter(Mission.id == mission_id).first()
    if not mission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Mission avec l'id {mission_id} introuvable."
        )

    interventions = db.query(Intervention).filter(Intervention.mission_id == mission_id).all()
    if not interventions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Impossible d'exporter : aucune intervention pour cette mission."
        )

    equipements = db.query(Equipement).filter(Equipement.site_id == mission.site_id).all()

    try:
        buffer, mime_type, filename = exporter_mission(mission, interventions, equipements)
        
        import re
        # Sanitize filename to avoid HTTP header encoding errors
        safe_filename = re.sub(r'[^A-Za-z0-9_\-\.]', '_', filename)
        
        return StreamingResponse(
            buffer,
            media_type=mime_type,
            headers={"Content-Disposition": f"attachment; filename={safe_filename}"}
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la gÃ©nÃ©ration de l'export: {str(e)}"
        )





