# coding: utf-8
from sqlalchemy import create_engine, text
engine = create_engine('mysql+pymysql://root:@localhost/sbs_db', pool_pre_ping=True)
with engine.connect() as conn:
    sites = conn.execute(text("SELECT id, nom, checklist_type, feuilles FROM sites WHERE checklist_type = 'MARSA_MAROC'")).fetchall()
    print('MARSA_MAROC sites:', sites)
    for s in sites:
        count = conn.execute(text(f"SELECT COUNT(*) FROM equipements WHERE site_id = {s[0]}")).fetchone()
        print(f'  Total EQ: {count[0]}')
        missions = conn.execute(text(f"SELECT id, titre, technicien_id FROM missions WHERE site_id = {s[0]}")).fetchall()
        print(f'  Missions:', missions)
        # Check all available columns
        sample = conn.execute(text(
            f"SELECT id, direction, bureau, famille, marque, modele, numero_serie, utilisateur_nom, cpu, ram, disque_dur, systeme_exploitation, sous_site "
            f"FROM equipements WHERE site_id = {s[0]} LIMIT 6"
        )).fetchall()
        print('  Sample EQ:')
        for e in sample:
            print('   ', e)
