# Ce fichier importe tous les modèles pour que SQLAlchemy
# puisse les découvrir et créer les tables correspondantes.
# L'ordre des imports respecte les dépendances (FK).

from app.models.user import User, RoleEnum
from app.models.marche import Marche
from app.models.site import Site
from app.models.equipement import Equipement, TypeEquipementEnum
from app.models.json_schema import JsonSchema
from app.models.mission import Mission, StatutMissionEnum
from app.models.intervention import Intervention

__all__ = [
    "User", "RoleEnum",
    "Marche",
    "Site",
    "Equipement", "TypeEquipementEnum",
    "JsonSchema",
    "Mission", "StatutMissionEnum",
    "Intervention",
]
