from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base


class Intervention(Base):
    """
    Table 'interventions' — Résultats d'un audit sur un équipement.
    Chaque intervention = le technicien a rempli un formulaire
    pour UN équipement dans le cadre d'UNE mission.

    Les réponses sont stockées en JSON (type JSON de MySQL).
    sync_en_attente : flag qui indique si les données ont été
    remontées vers le serveur après la saisie hors-ligne.
    """
    __tablename__ = "interventions"

    id = Column(Integer, primary_key=True, index=True)

    # -------------------------------------------------------
    # CLÉS ÉTRANGÈRES
    # -------------------------------------------------------
    # Mission dans laquelle s'inscrit cette intervention
    mission_id = Column(Integer, ForeignKey("missions.id"), nullable=False)

    # Équipement audité (peut être None si équipement non répertorié)
    equipement_id = Column(Integer, ForeignKey("equipements.id"), nullable=True)

    # Schéma JSON utilisé pour générer le formulaire
    json_schema_id = Column(Integer, ForeignKey("json_schemas.id"), nullable=True)

    # -------------------------------------------------------
    # DONNÉES DE L'AUDIT
    # -------------------------------------------------------
    # Réponses du technicien au formulaire — stockées en JSON
    # Ex: {"temperature": "OK", "ventilation": "Défaillante", ...}
    reponses = Column(JSON, nullable=True)

    # Observations libres du technicien
    observations = Column(Text, nullable=True)

    # Équipement non répertorié dans l'inventaire ? (ajout sur site)
    est_hors_inventaire = Column(Boolean, default=False)

    # Numéro de série saisi par le technicien sur site
    numero_serie_saisi = Column(String(150), nullable=True)

    # -------------------------------------------------------
    # SYNCHRONISATION OFFLINE → ONLINE
    # -------------------------------------------------------
    # True  = données saisies hors-ligne, pas encore envoyées au serveur
    # False = données confirmées par le serveur (synchronisation terminée)
    sync_en_attente = Column(Boolean, default=False)

    # Date de clôture de l'intervention sur mobile
    date_intervention = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relations
    mission = relationship("Mission", back_populates="interventions")
    equipement = relationship("Equipement")

    def __repr__(self):
        return f"<Intervention Mission:{self.mission_id} Equip:{self.equipement_id} sync:{self.sync_en_attente}>"
