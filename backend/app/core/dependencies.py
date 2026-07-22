from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.core.security import decode_access_token
from app.models.user import User, RoleEnum

# ============================================================
# SCHÉMA DE SÉCURITÉ HTTP BEARER
# ============================================================
# HTTPBearer lit automatiquement le header HTTP :
#   Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
# C'est le format standard pour envoyer un token JWT.
bearer_scheme = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    Dépendance FastAPI — Vérifie le token JWT et retourne l'utilisateur.
    
    Utilisation dans une route :
        @app.get("/profil")
        def mon_profil(current_user: User = Depends(get_current_user)):
            return current_user
    
    FastAPI appellera automatiquement get_current_user avant la route.
    Si le token est invalide → erreur 401 (Non autorisé).
    Si l'utilisateur n'existe plus → erreur 401.
    """
    # Exception standard pour les erreurs d'authentification
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token invalide ou expiré. Veuillez vous reconnecter.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Décodage du token
    token = credentials.credentials
    payload = decode_access_token(token)

    if payload is None:
        raise credentials_exception

    # Extraction de l'email depuis le token
    # "sub" = subject = identifiant principal (convention JWT)
    email: str = payload.get("sub")
    if email is None:
        raise credentials_exception

    # Recherche de l'utilisateur dans la BDD
    user = db.query(User).filter(User.email == email).first()
    if user is None or not user.is_active:
        raise credentials_exception

    return user


def require_role(*roles: RoleEnum):
    """
    Fabrique de dépendances — Restreint l'accès à certains rôles.
    
    Utilisation :
        # Seulement ADMIN et SUPERVISEUR peuvent accéder :
        @app.get("/missions")
        def liste_missions(user = Depends(require_role(RoleEnum.ADMIN, RoleEnum.SUPERVISEUR))):
            ...
        
        # Seulement TECHNICIEN :
        @app.get("/sync")
        def sync(user = Depends(require_role(RoleEnum.TECHNICIEN))):
            ...
    """
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Accès refusé. Rôle requis : {[r.value for r in roles]}"
            )
        return current_user
    return role_checker
