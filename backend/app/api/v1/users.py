from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.models.user import User, RoleEnum
from app.models.marche import Marche
from app.schemas.user import UserCreate, UserUpdate, UserResponse
from app.core.security import hash_password
from app.core.dependencies import get_current_user, require_role

# ============================================================
# ROUTER UTILISATEURS
# ============================================================
# Toutes les routes commencent par /users
# Seul l'ADMIN peut créer/modifier des utilisateurs
# Les SUPERVISEURS peuvent lister et consulter
# ============================================================
router = APIRouter(prefix="/users", tags=["Utilisateurs"])


@router.get("/", response_model=List[UserResponse])
def liste_utilisateurs(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.ADMIN, RoleEnum.SUPERVISEUR))
):
    """
    Retourne la liste de tous les utilisateurs.
    Accessible par : ADMIN, SUPERVISEUR

    Paramètres :
    - skip  : nombre d'utilisateurs à sauter (pagination)
    - limit : nombre max à retourner (défaut 100)
    """
    users = db.query(User).offset(skip).limit(limit).all()
    return users


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def creer_utilisateur(
    payload: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.ADMIN))
):
    """
    Crée un nouveau compte utilisateur (technicien ou superviseur).
    Accessible par : ADMIN uniquement

    Règles :
    - L'email doit être unique
    - Le mot de passe est haché avant stockage (jamais en clair)
    - Le rôle par défaut est TECHNICIEN
    - Un ADMIN ne peut pas créer un autre ADMIN via cette route
    """
    # Vérifier que l'email n'existe pas déjà
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Un utilisateur avec l'email '{payload.email}' existe déjà."
        )

    # Empêcher la création d'un autre ADMIN via cette route
    if payload.role == RoleEnum.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="La création d'un compte ADMIN n'est pas autorisée via cette route."
        )

    # Si un marché est fourni, vérifier qu'il existe
    if payload.marche_id:
        marche = db.query(Marche).filter(Marche.id == payload.marche_id).first()
        if not marche:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Le marché avec l'id {payload.marche_id} est introuvable."
            )

    # Créer l'utilisateur avec le mot de passe haché
    user = User(
        nom=payload.nom,
        prenom=payload.prenom,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role=payload.role,
        marche_id=payload.marche_id,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/me", response_model=UserResponse)
def mon_profil(current_user: User = Depends(get_current_user)):
    """
    Retourne le profil de l'utilisateur actuellement connecté.
    Accessible par : tous les utilisateurs authentifiés

    Utilisation : GET /users/me avec header Authorization: Bearer <token>
    """
    return current_user


@router.get("/{user_id}", response_model=UserResponse)
def get_utilisateur(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.ADMIN, RoleEnum.SUPERVISEUR))
):
    """
    Retourne le profil d'un utilisateur par son ID.
    Accessible par : ADMIN, SUPERVISEUR
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Utilisateur avec l'id {user_id} introuvable."
        )
    return user


@router.put("/{user_id}", response_model=UserResponse)
def modifier_utilisateur(
    user_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.ADMIN))
):
    """
    Modifie les informations d'un utilisateur.
    Accessible par : ADMIN uniquement

    Seuls les champs envoyés sont modifiés (PATCH-like).
    Exemple : envoyer uniquement {"is_active": false} désactive le compte.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Utilisateur avec l'id {user_id} introuvable."
        )

    # Empêcher de modifier le rôle de l'admin principal
    if user.email == "admin@sbs.ma" and payload.role is not None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Impossible de modifier le rôle de l'administrateur principal."
        )

    # Vérifier que le nouvel email n'est pas déjà utilisé
    if payload.email and payload.email != user.email:
        existing = db.query(User).filter(User.email == payload.email).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"L'email '{payload.email}' est déjà utilisé."
            )

    # Vérifier que le marché existe s'il est modifié
    if payload.marche_id:
        marche = db.query(Marche).filter(Marche.id == payload.marche_id).first()
        if not marche:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Le marché avec l'id {payload.marche_id} est introuvable."
            )

    # Mettre à jour seulement les champs fournis
    update_data = payload.model_dump(exclude_unset=True)
    
    # Hacher le nouveau mot de passe si présent
    if "password" in update_data:
        update_data["hashed_password"] = hash_password(update_data.pop("password"))
        
    for field, value in update_data.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}", status_code=status.HTTP_200_OK)
def desactiver_utilisateur(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.ADMIN))
):
    """
    Désactive (soft delete) un compte utilisateur.
    Accessible par : ADMIN uniquement

    Note : on ne supprime JAMAIS un utilisateur de la BDD (traçabilité).
    On le désactive uniquement → il ne pourra plus se connecter.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Utilisateur avec l'id {user_id} introuvable."
        )

    # Empêcher de désactiver l'admin principal
    if user.email == "admin@sbs.ma":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Impossible de désactiver l'administrateur principal."
        )

    user.is_active = False
    db.commit()
    return {"message": f"Utilisateur '{user.prenom} {user.nom}' désactivé avec succès."}
