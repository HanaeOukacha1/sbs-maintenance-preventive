from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base


class JsonSchema(Base):
    """
    Table 'json_schemas' — Modèles de checklists d'audit.
    Le superviseur importe des JSON Schemas depuis le portail web.
    L'application mobile lit ces schémas pour générer dynamiquement
    les formulaires d'audit (champs, cases à cocher, listes...).

    Versionnage : chaque modification crée une nouvelle version.
    L'ancienne version est conservée (historique).
    """
    __tablename__ = "json_schemas"

    id = Column(Integer, primary_key=True, index=True)

    # Nom du modèle (ex: "Checklist Serveur HP v2")
    nom = Column(String(200), nullable=False)

    # Type d'équipement ciblé par ce schéma
    type_equipement = Column(String(50), nullable=False)

    # Numéro de version (ex: 1, 2, 3...)
    version = Column(Integer, nullable=False, default=1)

    # Le schéma JSON lui-même — stocké en type JSON MySQL
    # Contient la structure des champs du formulaire
    schema_data = Column(JSON, nullable=False)

    # Seul le schéma actif est utilisé pour les nouvelles missions
    is_active = Column(Boolean, default=True)

    # Description / notes de version
    description = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relation : un schéma peut être utilisé dans plusieurs missions
    missions = relationship("Mission", back_populates="json_schema")

    def __repr__(self):
        return f"<JsonSchema {self.nom} v{self.version}>"
