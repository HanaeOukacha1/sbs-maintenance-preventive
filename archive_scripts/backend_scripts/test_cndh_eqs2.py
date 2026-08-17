# coding: utf-8
from sqlalchemy import create_engine, text
engine = create_engine('mysql+pymysql://root:@localhost/sbs_db')
rows = engine.connect().execute(text("SELECT id, site_id, famille, utilisateur_nom, marque, modele, type_equipement FROM equipements WHERE site_id IN (SELECT id FROM sites WHERE checklist_type LIKE 'CNDH%') LIMIT 20")).fetchall()
for r in rows:
    print(r)
