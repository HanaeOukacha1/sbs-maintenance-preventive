# coding: utf-8
from sqlalchemy import create_engine, text
engine = create_engine('mysql+pymysql://root:@localhost/sbs_db', pool_pre_ping=True)
with engine.connect() as conn:
    sites = conn.execute(text("SELECT id, nom, checklist_type, feuilles FROM sites WHERE checklist_type = 'AOH'")).fetchall()
    print('AOH sites:', sites)
    for s in sites:
        eqs = conn.execute(text(
            "SELECT id, designation, marque, modele, numero_serie, numero_inventaire, type_equipement "
            f"FROM equipements WHERE site_id = {s[0]} LIMIT 5"
        )).fetchall()
        print('  EQ sample:', eqs)
        missions = conn.execute(text(
            f"SELECT id, titre, technicien_id, statut FROM missions WHERE site_id = {s[0]}"
        )).fetchall()
        print('  Missions:', missions)
