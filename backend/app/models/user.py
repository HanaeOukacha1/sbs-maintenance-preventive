import enum
from sqlalchemy import Column, Integer, String, Boolean, Enum, DateTime
from sqlalchemy.sql import func
from app.db.database import Base


class RoleEnum(str, enum.Enum):
    """
    Énumération des rôles possibles.
    str est hérité pour que les valeurs soient des chaînes JSON-compatibles.
    """
    ADMIN = "ADMIN"
    SUPERVISEUR = "SUPERVISEUR"
    TECHNICIEN = "TECHNICIEN"


class User(Base):
    """
    Table 'users' — Tous les utilisateurs du système.
    - ADMIN       : gère les comptes et les référentiels
    - SUPERVISEUR : planifie les missions, consulte les rapports
    - TECHNICIEN  : utilise l'application mobile pour les audits
    """
    __tablename__ = "users"

    # Clé primaire — auto-incrémentée par MySQL
    id = Column(Integer, primary_key=True, index=True)

    # Informations personnelles
    nom = Column(String(100), nullable=False)
    prenom = Column(String(100), nullable=False)

    # Email unique — sert d'identifiant de connexion
    email = Column(String(150), unique=True, index=True, nullable=False)

    # Mot de passe haché avec bcrypt — JAMAIS en clair
    hashed_password = Column(String(255), nullable=False)

    # Rôle : ADMIN, SUPERVISEUR ou TECHNICIEN
    role = Column(Enum(RoleEnum), nullable=False, default=RoleEnum.TECHNICIEN)

    # Compte actif ou désactivé (soft delete)
    is_active = Column(Boolean, default=True)

    # Timestamps automatiques
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<User {self.email} ({self.role})>"
