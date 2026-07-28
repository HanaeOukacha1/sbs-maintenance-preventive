from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base


class Intervention(Base):
    """
    Table 'interventions' — Résultats d'un audit sur un équipement.

    Chaque intervention = le technicien a rempli la fiche
    pour UN équipement dans le cadre d'UNE mission.

    Les réponses sont stockées en JSON flexible pour s'adapter
    à tous les canevas (ADM, ANCFCC, AMEE, etc.).
    """
    __tablename__ = "interventions"

    id = Column(Integer, primary_key=True, index=True)

    # ------------------------------------------------------------------
    # CLÉS ÉTRANGÈRES
    # ------------------------------------------------------------------
    mission_id = Column(Integer, ForeignKey("missions.id"), nullable=False)
    equipement_id = Column(Integer, ForeignKey("equipements.id"), nullable=True)
    json_schema_id = Column(Integer, ForeignKey("json_schemas.id"), nullable=True)

    # ------------------------------------------------------------------
    # FEUILLE / ONGLET
    # Pour les sites multi-feuilles (ex: "PC", "Serveurs", "SIEGE")
    # ------------------------------------------------------------------
    feuille = Column(String(100), nullable=True)

    # ------------------------------------------------------------------
    # DONNÉES DE L'AUDIT — JSON flexible
    # Adapté à chaque marché :
    # ADM     → {"etat_software": "OK", "etat_hardware": "Non"}
    # ANCFCC  → {"points": [{"num": 1, "reponse": "oui", "obs": "..."}, ...]}
    # Standard→ {"observation": "BON"} ou {"etat": "OK"}
    # AMEE MàJ→ {"nettoyage_disque": "OK", "fichiers_temp": "OK", "maj_windows": "OK"}
    # ------------------------------------------------------------------
    reponses = Column(JSON, nullable=True)

    # Observations libres du technicien
    observations = Column(Text, nullable=True)

    # ------------------------------------------------------------------
    # ÉQUIPEMENT HORS-INVENTAIRE (ajouté sur site par le technicien)
    # ------------------------------------------------------------------
    est_hors_inventaire = Column(Boolean, default=False)
    # Données de l'équipement ajouté sur site (JSON)
    equipement_hors_inventaire = Column(JSON, nullable=True)
    # Ex: {"designation": "UC", "marque": "HP", "modele": "ProDesk", "numero_serie": "ABC123"}

    # ------------------------------------------------------------------
    # SIGNATURES (base64)
    # ------------------------------------------------------------------
    signature_technicien = Column(Text, nullable=True)
    signature_client = Column(Text, nullable=True)
    signature_utilisateur = Column(Text, nullable=True)  # MSANTE CAPM : signature de l'utilisateur de l'équipement

    # ------------------------------------------------------------------
    # HORODATAGE DE L'INTERVENTION
    # ------------------------------------------------------------------
    heure_debut = Column(DateTime(timezone=True), nullable=True)
    heure_fin = Column(DateTime(timezone=True), nullable=True)
    date_intervention = Column(DateTime(timezone=True), nullable=True)

    # ------------------------------------------------------------------
    # SYNCHRONISATION OFFLINE → ONLINE
    # True  = données saisies hors-ligne, pas encore envoyées au serveur
    # False = données confirmées par le serveur
    # ------------------------------------------------------------------
    sync_en_attente = Column(Boolean, default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relations
    mission = relationship("Mission", back_populates="interventions")
    equipement = relationship("Equipement")

    def __repr__(self):
        return f"<Intervention Mission:{self.mission_id} Equip:{self.equipement_id} Feuille:{self.feuille}>"
