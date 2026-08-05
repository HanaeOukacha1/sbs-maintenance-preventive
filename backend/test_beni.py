# coding: utf-8
from sqlalchemy import create_engine, text
engine = create_engine('mysql+pymysql://root:@localhost/sbs_db')
rows = engine.connect().execute(text("SELECT id, famille, marque, modele, utilisateur_nom FROM equipements WHERE site_id = (SELECT id FROM sites WHERE nom = 'CNDH BENI MELLAL' LIMIT 1) LIMIT 10")).fetchall()
for r in rows:
    print(r)
