from pydantic import BaseModel, EmailStr, field_validator
from datetime import datetime
from app.models.user import RoleEnum


# ============================================================
# SCHÉMAS D'ENTRÉE (requêtes → API)
# ============================================================

class UserCreate(BaseModel):
    """
    Données nécessaires pour créer un utilisateur.
    Envoyé par l'admin via POST /users
    """
    nom: str
    prenom: str
    email: EmailStr           # Pydantic valide automatiquement le format email
    password: str
    role: RoleEnum = RoleEnum.TECHNICIEN

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v):
        """Le mot de passe doit faire au moins 8 caractères"""
        if len(v) < 8:
            raise ValueError("Le mot de passe doit contenir au moins 8 caractères")
        return v


class UserUpdate(BaseModel):
    """
    Données modifiables d'un utilisateur.
    Tous les champs sont optionnels (on met à jour seulement ce qui est envoyé).
    """
    nom: str | None = None
    prenom: str | None = None
    email: EmailStr | None = None
    role: RoleEnum | None = None
    is_active: bool | None = None
    password: str | None = None

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v):
        """Si un mot de passe est fourni, il doit faire au moins 8 caractères"""
        if v is not None and len(v) < 8:
            raise ValueError("Le mot de passe doit contenir au moins 8 caractères")
        return v


class LoginRequest(BaseModel):
    """
    Données de connexion envoyées par le technicien ou superviseur.
    POST /auth/login
    """
    email: EmailStr
    password: str


# ============================================================
# SCHÉMAS DE SORTIE (API → réponse)
# ============================================================

class UserResponse(BaseModel):
    """
    Ce que l'API retourne quand on demande un utilisateur.
    IMPORTANT : le mot de passe (hashed_password) n'est JAMAIS retourné.
    """
    id: int
    nom: str
    prenom: str
    email: str
    role: RoleEnum
    is_active: bool
    created_at: datetime | None = None

    class Config:
        # Permet à Pydantic de lire les attributs d'un objet SQLAlchemy
        # (pas seulement les dictionnaires)
        from_attributes = True


class TokenResponse(BaseModel):
    """
    Réponse retournée après une connexion réussie.
    Contient le token JWT et les infos de l'utilisateur.
    """
    access_token: str
    token_type: str = "bearer"   # Convention OAuth2
    user: UserResponse
