from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base


class Marche(Base):
    """
    Table 'marches' — Les marchés clients de SBS.
    Un marché = un contrat avec un client.
    Un marché peut contenir plusieurs sites.
    """
    __tablename__ = "marches"

    id = Column(Integer, primary_key=True, index=True)

    # Nom du marché (ex: "Marché Ministère des Finances")
    nom = Column(String(200), nullable=False, unique=True)

    # Description optionnelle
    description = Column(Text, nullable=True)

    # Nom du client
    client = Column(String(200), nullable=False)

    # Logo URL
    logo_url = Column(String(255), nullable=True)

    # Numéro du marché
    numero = Column(String(100), nullable=True)

    # Informations d'en-tête additionnelles
    informations_entete = Column(Text, nullable=True)

    # Marché actif ou archivé
    is_active = Column(Boolean, default=True)

    # Timestamps automatiques
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relation : un marché a plusieurs sites
    # "back_populates" crée le lien inverse : site.marche
    sites = relationship("Site", back_populates="marche", cascade="all, delete-orphan")

    # Relation : un marché a plusieurs techniciens
    techniciens = relationship("User", back_populates="marche")

    def __repr__(self):
        return f"<Marche {self.nom} - {self.client}>"
