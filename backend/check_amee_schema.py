import sys
sys.path.append('.')
from app.db.database import SessionLocal
from sqlalchemy import text
import json

db = SessionLocal()
schemas = db.execute(text("SELECT j.id, j.type_equipement, j.schema_data, m.nom FROM json_schemas j JOIN marches m ON j.marche_id = m.id WHERE m.nom LIKE '%AMEE%'")).fetchall()
for s in schemas:
    schema_id = s[0]
    type_eq = s[1]
    schema_data = json.loads(s[2])
    marche_nom = s[3]
    
    # We want to find the UC / Desktop schema
    if type_eq and type_eq.lower() in ['uc', 'unité centrale', 'ordinateur', 'desktop', 'desktop / pc']:
        print(f"ID: {schema_id} | Type: {type_eq} | Marche: {marche_nom}")
        print("Schema:", json.dumps(schema_data, indent=2))
db.close()
