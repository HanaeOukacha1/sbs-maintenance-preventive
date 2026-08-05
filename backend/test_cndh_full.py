# coding: utf-8
from sqlalchemy import create_engine, text
engine = create_engine('mysql+pymysql://root:@localhost/sbs_db')
rows = engine.connect().execute(text("SELECT s.nom as site_nom, e.direction, e.bureau, e.utilisateur_nom, e.famille, e.marque, e.modele, e.numero_serie, e.type_equipement FROM equipements e JOIN sites s ON e.site_id = s.id WHERE s.checklist_type LIKE 'CNDH%' LIMIT 20")).fetchall()
print("First 20 CNDH Equipments:")
for r in rows:
    print(r)
