from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.models.json_schema import JsonSchema
from app.models.user import User, RoleEnum
from app.schemas.json_schema import JsonSchemaCreate, JsonSchemaUpdate, JsonSchemaResponse
from app.core.dependencies import get_current_user, require_role

# ============================================================
# ROUTER JSON SCHEMAS
# ============================================================
# Gère les modèles de formulaires dynamiques pour l'application mobile.
# ============================================================
router = APIRouter(prefix="/json-schemas", tags=["JSON Schemas"])


@router.get("/", response_model=List[JsonSchemaResponse])
def liste_schemas(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retourne la liste de tous les JSON Schemas.
    Accessible par : Tous les utilisateurs authentifiés
    """
    schemas = db.query(JsonSchema).offset(skip).limit(limit).all()
    return schemas


@router.post("/", response_model=JsonSchemaResponse, status_code=status.HTTP_201_CREATED)
def creer_schema(
    payload: JsonSchemaCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.ADMIN))
):
    """
    Crée un nouveau JSON Schema.
    Accessible par : ADMIN uniquement
    """
    schema = JsonSchema(
        nom=payload.nom,
        type_equipement=payload.type_equipement,
        version=1,
        schema_data=payload.schema_data,
        is_active=True,
        description=payload.description
    )
    db.add(schema)
    db.commit()
    db.refresh(schema)
    return schema


@router.get("/{schema_id}", response_model=JsonSchemaResponse)
def get_schema(
    schema_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retourne un JSON Schema par son ID.
    Accessible par : Tous les utilisateurs authentifiés
    """
    schema = db.query(JsonSchema).filter(JsonSchema.id == schema_id).first()
    if not schema:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"JSON Schema avec l'id {schema_id} introuvable."
        )
    return schema


@router.put("/{schema_id}", response_model=JsonSchemaResponse)
def modifier_schema(
    schema_id: int,
    payload: JsonSchemaUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.ADMIN))
):
    """
    Modifie un JSON Schema (crée une nouvelle version implicitement si schema_data change).
    Accessible par : ADMIN uniquement
    """
    schema = db.query(JsonSchema).filter(JsonSchema.id == schema_id).first()
    if not schema:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"JSON Schema avec l'id {schema_id} introuvable."
        )

    update_data = payload.model_dump(exclude_unset=True)
    
    # Si le schéma JSON change, on incrémente la version
    if "schema_data" in update_data and update_data["schema_data"] != schema.schema_data:
        schema.version += 1

    for field, value in update_data.items():
        setattr(schema, field, value)

    db.commit()
    db.refresh(schema)
    return schema


@router.delete("/{schema_id}", status_code=status.HTTP_200_OK)
def desactiver_schema(
    schema_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.ADMIN))
):
    """
    Désactive un JSON Schema sans le supprimer.
    Accessible par : ADMIN uniquement
    """
    schema = db.query(JsonSchema).filter(JsonSchema.id == schema_id).first()
    if not schema:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"JSON Schema avec l'id {schema_id} introuvable."
        )

    schema.is_active = False
    db.commit()
    return {"message": f"JSON Schema '{schema.nom}' désactivé avec succès."}
