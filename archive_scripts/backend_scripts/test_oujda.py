# coding: utf-8
from sqlalchemy import create_engine, text
engine = create_engine('mysql+pymysql://root:@localhost/sbs_db')
rows = engine.connect().execute(text("SELECT s.nom, e.direction, e.utilisateur_nom, e.famille, e.marque FROM equipements e JOIN sites s ON e.site_id = s.id WHERE s.nom LIKE 'CNDH%OUJDA%' LIMIT 10")).fetchall()
print("Oujda Equipments:")
for r in rows:
    print(r)
