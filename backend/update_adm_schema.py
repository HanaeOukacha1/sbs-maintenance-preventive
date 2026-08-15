import sys, os, json
sys.path.append(os.path.abspath('.'))
from app.db.database import SessionLocal
from sqlalchemy import text

db = SessionLocal()

# Le bon schema ADM avec exactement 7 champs :
# - 2 états (Etat Software, Etat Hardware) sous forme de booléens OK/Non
# - 5 consignes de consistance des travaux
new_schema = [
  {"key": "etat_software", "label": "Etat Software", "options": ["OK", "Non"]},
  {"key": "etat_hardware", "label": "Etat Hardware", "options": ["OK", "Non"]},
  {"key": "adm1", "label": "Le contrôle et le maintien du bon état de fonctionnement des équipements et dispositifs", "options": ["oui", "non"]},
  {"key": "adm2", "label": "Les mises au point nécessaires et le remplacement des pièces hors d'usage", "options": ["oui", "non"]},
  {"key": "adm3", "label": "Le diagnostic des équipements si nécessaire", "options": ["oui", "non"]},
  {"key": "adm4", "label": "L'identification des risques de dysfonctionnement et les améliorations liées à l'évolution du système", "options": ["oui", "non"]},
  {"key": "adm5", "label": "Le nettoyage extérieur ; le dépoussiérage des différents équipements matériel des serveurs (LS) Péage et le nettoyage de tous lecteurs et périphériques en utilisant les produits appropriés", "options": ["oui", "non"]}
]
schema_json = json.dumps(new_schema, ensure_ascii=False)

# Mettre à jour les 2 entrées (ID:1 "Schema ADM" et ID:16 "ADM")
r1 = db.execute(text("UPDATE json_schemas SET schema_data = :data WHERE id = 1"), {'data': schema_json})
r2 = db.execute(text("UPDATE json_schemas SET schema_data = :data WHERE id = 16"), {'data': schema_json})
db.commit()

# Vérifier
print(f"Rows updated: {r1.rowcount + r2.rowcount}")
rows = db.execute(text("SELECT id, nom, schema_data FROM json_schemas WHERE id IN (1, 16)")).fetchall()
for r in rows:
    data = json.loads(r[2])
    print(f"\nID:{r[0]} NOM:'{r[1]}' -> {len(data)} consignes")
    for item in data:
        print(f"  [{item['key']}] {item['label'][:60]}")
db.close()
