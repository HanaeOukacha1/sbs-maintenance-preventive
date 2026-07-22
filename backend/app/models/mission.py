import enum
from sqlalchemy import Column, Integer, String, Text, DateTime, Date, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base


class StatutMissionEnum(str, enum.Enum):
    """Cycle de vie d'une mission"""
    PLANIFIEE = "PLANIFIEE"       # Créée par le superviseur, pas encore démarrée
    EN_COURS = "EN_COURS"         # Le technicien a commencé l'audit
    TERMINEE = "TERMINEE"         # Audit clôturé sur le mobile
    SYNCHRONISEE = "SYNCHRONISEE" # Données remontées vers le serveur


class Mission(Base):
    """
    Table 'missions' — Planification des interventions.
    Le superviseur assigne une mission à un technicien :
    qui intervient, sur quel site, à quelle date, avec quel schéma.
    """
    __tablename__ = "missions"

    id = Column(Integer, primary_key=True, index=True)

    # Titre de la mission (ex: "Audit trimestriel Serveurs - Site Rabat")
    titre = Column(String(250), nullable=False)
    description = Column(Text, nullable=True)

    # Date planifiée d'intervention
    date_planifiee = Column(Date, nullable=False)

    # Statut dans le cycle de vie
    statut = Column(Enum(StatutMissionEnum), default=StatutMissionEnum.PLANIFIEE, nullable=False)

    # -------------------------------------------------------
    # CLÉS ÉTRANGÈRES
    # -------------------------------------------------------
    # Technicien assigné à cette mission
    technicien_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Site d'intervention
    site_id = Column(Integer, ForeignKey("sites.id"), nullable=False)

    # Modèle de checklist à utiliser
    json_schema_id = Column(Integer, ForeignKey("json_schemas.id"), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relations
    technicien = relationship("User", foreign_keys=[technicien_id])
    site = relationship("Site", back_populates="missions")
    json_schema = relationship("JsonSchema", back_populates="missions")
    interventions = relationship("Intervention", back_populates="mission", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Mission {self.titre} - {self.statut}>"
