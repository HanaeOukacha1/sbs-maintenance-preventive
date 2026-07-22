import enum
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base


class TypeEquipementEnum(str, enum.Enum):
    """
    Types d'équipements autorisés.
    Liste complète basée sur l'analyse des Master Data SBS.
    """
    SERVEUR = "SERVEUR"
    PC = "PC"                        # UC, PC Bureau, Desktop
    PORTABLE = "PORTABLE"            # PC Portable, Laptop, PT
    ONDULEUR = "ONDULEUR"            # UPS, Onduleur
    BAIE_BRASSAGE = "BAIE_BRASSAGE"  # Baie de brassage, Switch, Routeur
    IMPRIMANTE = "IMPRIMANTE"        # Imprimante, MFP, Jet d'encre, Laser
    ECRAN = "ECRAN"                  # Écran, Moniteur
    SCANNER = "SCANNER"              # Scanner
    AUTRE = "AUTRE"                  # Autres équipements non classifiés


class Equipement(Base):
    """
    Table 'equipements' — Inventaire théorique des équipements.
    Chaque équipement est rattaché à un site précis.
    C'est cet inventaire que le technicien consulte hors-ligne
    pour valider les équipements présents sur site.
    """
    __tablename__ = "equipements"

    id = Column(Integer, primary_key=True, index=True)

    # Identifiant constructeur (numéro de série, tag RFID, etc.)
    numero_serie = Column(String(150), nullable=True, index=True)

    # Nom ou modèle de l'équipement
    nom = Column(String(200), nullable=False)
    marque = Column(String(100), nullable=True)
    modele = Column(String(150), nullable=True)

    # Type d'équipement (ENUM)
    type_equipement = Column(Enum(TypeEquipementEnum), nullable=False)

    # Notes techniques
    description = Column(Text, nullable=True)

    # Équipement actif dans l'inventaire ou retiré
    is_active = Column(Boolean, default=True)

    # -------------------------------------------------------
    # CLÉ ÉTRANGÈRE → sites.id
    # REMARQUE SUPERVISEUR : chaque équipement doit référencer
    # le site où il se trouve physiquement.
    # -------------------------------------------------------
    site_id = Column(Integer, ForeignKey("sites.id"), nullable=False)

    # Timestamps automatiques
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relation inverse : equipement.site → accès au site parent
    site = relationship("Site", back_populates="equipements")

    def __repr__(self):
        return f"<Equipement {self.type_equipement} - {self.nom} (Site: {self.site_id})>"
