# coding: utf-8
from sqlalchemy import create_engine, text
import json
engine = create_engine('mysql+pymysql://root:@localhost/sbs_db', pool_pre_ping=True)
with engine.connect() as conn:
    sites = conn.execute(text("SELECT id, nom, checklist_type, feuilles FROM sites WHERE checklist_type = 'INPPLC'")).fetchall()
    print('INPPLC sites:', sites)
    for s in sites:
        count = conn.execute(text(f"SELECT COUNT(*) FROM equipements WHERE site_id = {s[0]}")).fetchone()
        types = conn.execute(text(f"SELECT DISTINCT type_equipement, famille, sous_site FROM equipements WHERE site_id = {s[0]} LIMIT 10")).fetchall()
        print(f'  Total EQ: {count[0]}')
        print(f'  Types:', types)
        missions = conn.execute(text(f"SELECT id, titre, technicien_id FROM missions WHERE site_id = {s[0]}")).fetchall()
        print(f'  Missions:', missions)
        sample = conn.execute(text(
            f"SELECT id, famille, marque, modele, numero_serie, type_equipement, sous_site FROM equipements WHERE site_id = {s[0]} LIMIT 6"
        )).fetchall()
        print('  Sample EQ:', sample)
