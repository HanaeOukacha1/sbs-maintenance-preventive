import os, sys, json
sys.path.append(os.path.abspath(r'C:\Users\hanae\Desktop\Stage PFA 2026\backend'))
from app.db.database import SessionLocal
from app.models.mission import Mission
from app.models.intervention import Intervention
from app.models.equipement import Equipement
from sqlalchemy import text

db = SessionLocal()
mission = db.query(Mission).filter(Mission.id == 502).first()
interventions = db.query(Intervention).filter(Intervention.mission_id == 502).all()
equipements = db.query(Equipement).filter(Equipement.site_id == mission.site_id).all()

schema_ids = set(i.json_schema_id for i in interventions if i.json_schema_id)
print('Schema IDs used:', schema_ids)

for sid in schema_ids:
    row = db.execute(text('SELECT nom, schema_data FROM json_schemas WHERE id=:id'), {'id': sid}).fetchone()
    if row:
        data = row[1]
        if isinstance(data, str):
            data = json.loads(data)
        print(f'\nSchema {sid} ({row[0]}):')
        for f in data:
            print(f"  key={f.get('key')}, label={f.get('label')}, type={f.get('type')}")

print('\n\nSample interventions (eq_id, schema_id, feuille, reponse_keys):')
for i in interventions:
    keys = list(i.reponses.keys()) if i.reponses else []
    print(f"  EQ {i.equipement_id}, schema={i.json_schema_id}, feuille={i.feuille}")
    print(f"    keys: {keys}")
    if i.reponses and 'equipement_modifie' in i.reponses:
        em = i.reponses['equipement_modifie']
        print(f"    equipement_modifie: {em}")

print('\n\nEquipements sample:')
for eq in equipements[:5]:
    t = getattr(eq, 'type_equipement', '')
    if hasattr(t, 'value'): t = t.value
    print(f"  EQ {eq.id}: nom={eq.nom}, type={t}, marque={eq.marque}, modele={eq.modele}, user={eq.utilisateur_nom}, bureau={eq.bureau}")

db.close()
