# coding: utf-8
from sqlalchemy import create_engine, text
import json

engine = create_engine('mysql+pymysql://root:@localhost/sbs_db')
with engine.connect() as conn:
    uid = 4  # hanae@sbs.ma
    
    # 1. Assign missions 5 and 6 to hanae, remove all others
    conn.execute(text(f"UPDATE missions SET technicien_id = 1 WHERE technicien_id = {uid}"))
    conn.execute(text(f"UPDATE missions SET technicien_id = {uid}, statut = 'PLANIFIEE' WHERE id IN (5, 6)"))
    
    # 2. Delete old interventions for clean test
    conn.execute(text("DELETE FROM interventions WHERE mission_id IN (5, 6)"))
    
    # 3. Fix Marrakech site feuilles to match the 5 sheets
    marr_feuilles = json.dumps(['DATA CENTER', 'UC', 'MISE A JOUR', 'IMPRIMANTE ET MFP', 'AVANCEE'])
    conn.execute(text(f"UPDATE sites SET feuilles = :f WHERE id = 93"), {'f': marr_feuilles})
    
    # 4. Fix Rabat site feuilles to match the 4 sheets
    rabat_feuilles = json.dumps(['PC', 'MISE A JOUR', 'IMP ET MFP RESEAUX', 'DATA CENTER'])
    conn.execute(text(f"UPDATE sites SET feuilles = :f WHERE id = 94"), {'f': rabat_feuilles})
    
    # 5. Fix sous_site values for Marrakech equipment to match tab names
    # UC -> UC  (already 'UC ')
    conn.execute(text("UPDATE equipements SET sous_site = 'UC' WHERE site_id = 93 AND sous_site = 'UC '"))
    
    # Check distinct sous_sites in Marrakech
    ss = conn.execute(text("SELECT DISTINCT sous_site, type_equipement FROM equipements WHERE site_id = 93")).fetchall()
    print('Marrakech sous_sites:', ss)
    
    # Check Rabat sous_sites 
    ss_r = conn.execute(text("SELECT DISTINCT sous_site, type_equipement FROM equipements WHERE site_id = 94")).fetchall()
    print('Rabat sous_sites:', ss_r)
    
    conn.commit()
    print('Done.')
