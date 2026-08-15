import enum
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Float, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base


class TypeEquipementEnum(str, enum.Enum):
    """
    Types d'équipements — liste complète issue de l'analyse des Master Data SBS.
    """
    SERVEUR = "SERVEUR"
    PC = "PC"                        # UC, PC Bureau, Desktop, Fixe
    PORTABLE = "PORTABLE"            # PC Portable, Laptop
    AIO = "AIO"                      # All-in-One
    ONDULEUR = "ONDULEUR"            # UPS, Onduleur
    BAIE_STOCKAGE = "BAIE_STOCKAGE"  # Baie de stockage / brassage
    KVM = "KVM"                      # KVM Switch
    IMPRIMANTE = "IMPRIMANTE"        # Imprimante, MFP, Laser, Jet d'encre
    FAX = "FAX"                      # Fax
    ECRAN = "ECRAN"                  # Écran, Moniteur
    SCANNER = "SCANNER"              # Scanner
    PHOTOCOPIEUR = "PHOTOCOPIEUR"    # Photocopieur
    AUTRE = "AUTRE"                  # Autres équipements non classifiés


class Equipement(Base):
    """
    Table 'equipements' — Inventaire complet des équipements SBS.

    Chaque équipement est rattaché à un site.
    Les champs optionnels couvrent les spécificités de chaque marché
    sans multiplier les tables. Les champs non pertinents restent NULL.

    Clé métier : numero_serie (unique par site selon les Master Data).
    """
    __tablename__ = "equipements"

    id = Column(Integer, primary_key=True, index=True)

    # ------------------------------------------------------------------
    # CHAMPS COMMUNS À TOUS LES MARCHÉS
    # ------------------------------------------------------------------
    # Clé primaire métier — numéro de série constructeur
    numero_serie = Column(String(150), nullable=False, index=True)

    # Désignation / famille de l'équipement
    # (ex: "UC", "IMPRIMANTE", "Serveur Principal", "PC PORTABLE")
    designation = Column(String(200), nullable=True)

    # Nom/modèle de l'équipement (affiché dans les listes)
    nom = Column(String(200), nullable=False)
    marque = Column(String(100), nullable=True)
    modele = Column(String(150), nullable=True)

    # Type d'équipement (ENUM pour filtrage)
    type_equipement = Column(Enum(TypeEquipementEnum), nullable=False, default=TypeEquipementEnum.AUTRE)

    # Équipement actif dans l'inventaire ou retiré
    is_active = Column(Boolean, default=True)

    # ------------------------------------------------------------------
    # LOCALISATION (Marsa Maroc, AMEE, CNDH Groupe 2 & Siège)
    # ------------------------------------------------------------------
    direction = Column(String(200), nullable=True)    # Marsa Maroc : Direction
    bureau = Column(String(200), nullable=True)       # Marsa Maroc : Bureau/RDC
    emplacement = Column(String(200), nullable=True)  # CNDH, AMEE : emplacement physique (ex: "1-6", "SALLE DE REUNION")
    affectation = Column(String(200), nullable=True)  # CNDH, AMEE : personne affectée (ex: "TIJANI", "IMANE ARBOUCH")
    entite = Column(String(200), nullable=True)       # CNDH : entité (ex: "CRDH DE DRAA TAFILALT", "COM")
    utilisateur_nom = Column(String(200), nullable=True)  # Marsa Maroc, AMEE Rabat PC, MSANTE CAPM : nom utilisateur

    # ------------------------------------------------------------------
    # SOUS-SITE (CNDH Siège: SIEGE/IFHD/AGDAL | MSANTE DPRF: niveaux)
    # ------------------------------------------------------------------
    sous_site = Column(String(100), nullable=True)

    # ------------------------------------------------------------------
    # NUMÉRO D'INVENTAIRE (AOH, MHAI, AMEE Rabat PC)
    # ------------------------------------------------------------------
    numero_inventaire = Column(String(100), nullable=True)

    # ------------------------------------------------------------------
    # FAMILLE (INPPLC : "IMPRIMANTE" / "PC PORTABLE")
    # ------------------------------------------------------------------
    famille = Column(String(100), nullable=True)

    # ------------------------------------------------------------------
    # SPECS TECHNIQUES (AMEE Serveurs & PC, Marsa Maroc, MSANTE)
    # ------------------------------------------------------------------
    cpu = Column(String(200), nullable=True)
    ram = Column(String(100), nullable=True)
    disque_dur = Column(String(150), nullable=True)   # Disque C (ou disque unique)
    disque_c = Column(String(150), nullable=True)      # ADM : Disque C spécifique
    disque_d = Column(String(150), nullable=True)      # ADM : Disque D
    systeme_exploitation = Column(String(150), nullable=True)
    stockage_utilise = Column(String(100), nullable=True)  # Espace disque utilisé (AMEE Rabat PC)
    antivirus = Column(String(100), nullable=True)

    # ------------------------------------------------------------------
    # RÉSEAU (ADM Serveurs)
    # ------------------------------------------------------------------
    ip = Column(String(50), nullable=True)

    # ------------------------------------------------------------------
    # ADM — PAIRES SERVEUR PRINCIPAL / REDONDANT
    # ------------------------------------------------------------------
    est_serveur_redondant = Column(Boolean, default=False)
    # FK vers le serveur principal (si cet équipement est le redondant)
    serveur_principal_id = Column(Integer, ForeignKey("equipements.id"), nullable=True)

    # ------------------------------------------------------------------
    # ANCFCC — ONDULEUR
    # ------------------------------------------------------------------
    puissance_kva = Column(String(50), nullable=True)    # Puissance en KVA
    nb_batteries = Column(Integer, nullable=True)        # Nombre de batteries
    capacite_batteries = Column(String(100), nullable=True)  # "C à B"
    zone = Column(String(100), nullable=True)             # Zone géographique (SUD, NORD...)

    # ------------------------------------------------------------------
    # NOTES LIBRES
    # ------------------------------------------------------------------
    description = Column(Text, nullable=True)

    # ------------------------------------------------------------------
    # CLÉ ÉTRANGÈRE → sites.id
    # ------------------------------------------------------------------
    site_id = Column(Integer, ForeignKey("sites.id"), nullable=False)

    # Timestamps automatiques
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relations
    site = relationship("Site", back_populates="equipements")
    serveur_principal = relationship("Equipement", remote_side="Equipement.id", foreign_keys=[serveur_principal_id])

    def __repr__(self):
        return f"<Equipement {self.designation or self.type_equipement} - {self.marque} {self.modele} (S/N: {self.numero_serie})>"
