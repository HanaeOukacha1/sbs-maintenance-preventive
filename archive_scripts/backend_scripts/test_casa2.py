# coding: utf-8
from sqlalchemy import create_engine, text
engine = create_engine('mysql+pymysql://root:@localhost/sbs_db')
rows = engine.connect().execute(text("SELECT id, sous_site, famille, marque, modele, utilisateur_nom FROM equipements WHERE site_id = (SELECT id FROM sites WHERE nom = 'CNDH CASABLANCA' LIMIT 1)")).fetchall()
print("Casa DB Equipments:")
for r in rows:
    print(r)
