from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base


class Site(Base):
    """
    Table 'sites' — Les sites physiques d'un marché.
    Un site = une adresse géographique d'intervention.
    Ex: "Siège Ministère - Rabat", "Data Center Agdal"
    """
    __tablename__ = "sites"

    id = Column(Integer, primary_key=True, index=True)

    # Nom du site
    nom = Column(String(200), nullable=False)

    # Adresse physique
    adresse = Column(String(300), nullable=True)
    ville = Column(String(100), nullable=True)

    # Description / notes
    description = Column(Text, nullable=True)

    # Site actif ou archivé
    is_active = Column(Boolean, default=True)

    # -------------------------------------------------------
    # CLÉ ÉTRANGÈRE → marches.id
    # Un site appartient obligatoirement à un marché.
    # Si le marché est supprimé, le site l'est aussi (cascade).
    # -------------------------------------------------------
    marche_id = Column(Integer, ForeignKey("marches.id"), nullable=False)

    # Timestamps automatiques
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relation inverse : site.marche → accès au marché parent
    marche = relationship("Marche", back_populates="sites")

    # Relation : un site a plusieurs équipements
    equipements = relationship("Equipement", back_populates="site", cascade="all, delete-orphan")

    # Relation : un site peut avoir plusieurs missions
    missions = relationship("Mission", back_populates="site")

    def __repr__(self):
        return f"<Site {self.nom} - {self.ville}>"
