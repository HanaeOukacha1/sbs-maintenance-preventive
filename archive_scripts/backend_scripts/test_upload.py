
payload = {
  'mission_id': 70, 
  'equipement_id': 1,
  'feuille': None,
  'reponses': {'pt1': 'oui'},
  'observations': None,
  'est_hors_inventaire': False,
  'equipement_hors_inventaire': None,
  'signature_technicien': None,
  'signature_client': None,
  'signature_utilisateur': None,
  'heure_debut': None,
  'heure_fin': None,
}

from fastapi.testclient import TestClient
from app.main import app
from app.core.dependencies import get_current_user
from app.models.user import User, RoleEnum

def override_get_current_user():
    return User(id=4, email='hanae@sbs.ma', role=RoleEnum.TECHNICIEN)

app.dependency_overrides[get_current_user] = override_get_current_user

client = TestClient(app)
response = client.post('/api/v1/interventions/', json=payload)
print('STATUS:', response.status_code)
print('RESPONSE:', response.text)

