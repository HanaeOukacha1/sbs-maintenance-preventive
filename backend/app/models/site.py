import enum
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, JSON, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base


class ChecklistTypeEnum(str, enum.Enum):
    """
    Type de checklist associé à un site.
    Détermine quel caneva s'affiche dans l'app mobile.
    """
    ADM = "ADM"
    AMEE_MARRAKECH = "AMEE_MARRAKECH"       # 2 onglets : Imp & MFP / Serveurs
    AMEE_RABAT = "AMEE_RABAT"               # 4 onglets : PC / MàJ Windows / Imp MFP / Data Center
    ANCFCC = "ANCFCC"                       # 1 onduleur + 10 points de vérification
    ANP = "ANP"                             # Liste simple avec État OK/Non
    AOH = "AOH"                             # Liste simple avec État BON/Non
    INPPLC = "INPPLC"                       # 2 onglets : Imprimantes / PC Portables
    MARSA_MAROC = "MARSA_MAROC"             # Liste avec Direction/Bureau/Utilisateur
    MHAI = "MHAI"                           # Liste simple avec Observation
    MSANTE_STANDARD = "MSANTE_STANDARD"     # Liste standard (majorité des sites)
    MSANTE_CAPM = "MSANTE_CAPM"             # Liste + Utilisateur + Signature utilisateur
    MSANTE_DPRF = "MSANTE_DPRF"             # Multi-niveaux (Comptabilité, DPE, Budget, Planification, Administrative)
    ONP = "ONP"                             # Liste filtrée par site (colonne Site dans le tableau)
    CNDH_G1 = "CNDH_G1"                    # Groupe 1 : Entité + Article + Marque + Modèle + S/N + Obs
    CNDH_G2 = "CNDH_G2"                    # Groupe 2 : + Emplacement + Affectation
    CNDH_SIEGE = "CNDH_SIEGE"              # Siège Rabat : 3 onglets (SIEGE / IFHD / AGDAL)


class Site(Base):
    """
    Table 'sites' — Les sites physiques d'un marché.
    Un site = une adresse géographique d'intervention.

    Le champ checklist_type détermine quel caneva s'affiche dans l'app mobile.
    Le champ feuilles (JSON) liste les onglets disponibles pour les sites multi-feuilles.
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

    # ------------------------------------------------------------------
    # TYPE DE CHECKLIST
    # Détermine quel caneva s'affiche dans l'app mobile pour ce site.
    # ------------------------------------------------------------------
    checklist_type = Column(Enum(ChecklistTypeEnum), nullable=True)

    # ------------------------------------------------------------------
    # FEUILLES / ONGLETS DISPONIBLES
    # Pour les sites multi-feuilles (AMEE Rabat, INPPLC, CNDH Siège, etc.)
    # Stocké en JSON, ex: ["PC", "MàJ Windows", "Imp & MFP Réseaux", "Data Center"]
    # ------------------------------------------------------------------
    feuilles = Column(JSON, nullable=True)

    # ------------------------------------------------------------------
    # CLÉ ÉTRANGÈRE → marches.id
    # ------------------------------------------------------------------
    marche_id = Column(Integer, ForeignKey("marches.id"), nullable=False)

    # Timestamps automatiques
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relations
    marche = relationship("Marche", back_populates="sites")
    equipements = relationship("Equipement", back_populates="site", cascade="all, delete-orphan")
    missions = relationship("Mission", back_populates="site")

    def __repr__(self):
        return f"<Site {self.nom} - {self.ville} ({self.checklist_type})>"
