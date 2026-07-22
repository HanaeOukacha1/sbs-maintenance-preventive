from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.user import User
from app.schemas.user import LoginRequest, TokenResponse, UserResponse
from app.core.security import verify_password, create_access_token, hash_password
from app.core.dependencies import get_current_user

# ============================================================
# ROUTER D'AUTHENTIFICATION
# ============================================================
# prefix="/auth" → toutes les routes commencent par /auth
# tags=["Auth"]  → groupe dans la doc Swagger
router = APIRouter(prefix="/auth", tags=["Authentification"])


@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """
    Connexion d'un utilisateur.
    
    Reçoit : { "email": "...", "password": "..." }
    Retourne : { "access_token": "eyJ...", "token_type": "bearer", "user": {...} }
    
    Étapes :
    1. Cherche l'utilisateur par email dans la BDD
    2. Vérifie le mot de passe avec bcrypt
    3. Génère un token JWT
    4. Retourne le token + les infos utilisateur
    """
    # Étape 1 : Chercher l'utilisateur par email
    user = db.query(User).filter(User.email == request.email).first()

    # Étape 2 : Vérifier que l'utilisateur existe ET que le mot de passe est correct
    # On retourne la MÊME erreur dans les deux cas (sécurité : ne pas révéler si l'email existe)
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect",
        )

    # Vérifier que le compte est actif
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Ce compte a été désactivé. Contactez votre administrateur.",
        )

    # Étape 3 : Générer le token JWT
    # "sub" (subject) = identifiant principal de l'utilisateur dans le token
    access_token = create_access_token(data={
        "sub": user.email,
        "role": user.role.value,
        "user_id": user.id
    })

    # Étape 4 : Retourner le token et les infos utilisateur
    return TokenResponse(
        access_token=access_token,
        user=UserResponse.model_validate(user)
    )


@router.get("/me", response_model=UserResponse)
def get_my_profile(current_user: User = Depends(get_current_user)):
    """
    Retourne le profil de l'utilisateur actuellement connecté.
    Route protégée : nécessite un token JWT valide.
    
    Utilisation : GET /auth/me avec header "Authorization: Bearer <token>"
    """
    return current_user


@router.post("/init-admin", response_model=UserResponse, tags=["Setup"])
def create_first_admin(db: Session = Depends(get_db)):
    """
    Crée le premier compte administrateur si aucun n'existe.
    À utiliser UNE SEULE FOIS lors de l'installation.
    Ensuite cette route devra être désactivée en production.
    """
    # Vérifier qu'il n'existe pas déjà un admin
    existing_admin = db.query(User).filter(User.email == "admin@sbs.ma").first()
    if existing_admin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Un compte admin existe déjà."
        )

    from app.models.user import RoleEnum
    admin = User(
        nom="Administrateur",
        prenom="SBS",
        email="admin@sbs.ma",
        hashed_password=hash_password("Admin@SBS2026"),
        role=RoleEnum.ADMIN,
        is_active=True
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    return admin
