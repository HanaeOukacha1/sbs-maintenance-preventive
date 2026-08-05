# coding: utf-8
from sqlalchemy import create_engine, text
import json

engine = create_engine('mysql+pymysql://root:@localhost/sbs_db', pool_pre_ping=True)
with engine.connect() as conn:
    conn.execute(text('UPDATE missions SET technicien_id = 4, statut = :s WHERE id IN (5, 6)'), {'s': 'PLANIFIEE'})
    conn.commit()
    conn.execute(text('DELETE FROM interventions WHERE mission_id IN (5, 6)'))
    conn.commit()

    marr_feuilles = json.dumps(['DATA CENTER', 'UC', 'MISE A JOUR', 'IMPRIMANTE ET MFP', 'AVANCEE'])
    conn.execute(text('UPDATE sites SET feuilles = :f WHERE id = 93'), {'f': marr_feuilles})
    conn.commit()

    rabat_feuilles = json.dumps(['PC', 'MISE A JOUR', 'IMP ET MFP RESEAUX', 'DATA CENTER'])
    conn.execute(text('UPDATE sites SET feuilles = :f WHERE id = 94'), {'f': rabat_feuilles})
    conn.commit()

    # Fix sous_site for UC sheet (has trailing space)
    conn.execute(text("UPDATE equipements SET sous_site = 'UC' WHERE site_id = 93 AND sous_site LIKE 'UC%'"))
    conn.commit()

    # Make sure Marrakech DATA CENTER and other sheets are set correctly
    conn.execute(text("UPDATE equipements SET sous_site = 'DATA CENTER' WHERE site_id = 93 AND sous_site = 'Serveurs'"))
    conn.commit()
    conn.execute(text("UPDATE equipements SET sous_site = 'IMPRIMANTE ET MFP' WHERE site_id = 93 AND sous_site LIKE 'Imprimante%'"))
    conn.commit()
    conn.execute(text("UPDATE equipements SET sous_site = 'AVANCEE' WHERE site_id = 93 AND sous_site IS NULL AND type_equipement IN ('PC','PORTABLE','ECRAN')"))
    conn.commit()

    ss = conn.execute(text('SELECT DISTINCT sous_site, type_equipement FROM equipements WHERE site_id = 93')).fetchall()
    print('Marrakech sous_sites:', ss)

    ss_r = conn.execute(text('SELECT DISTINCT sous_site, type_equipement FROM equipements WHERE site_id = 94')).fetchall()
    print('Rabat sous_sites:', ss_r)

    missions = conn.execute(text('SELECT id, titre, technicien_id, statut FROM missions WHERE id IN (5,6)')).fetchall()
    print('Missions:', missions)

print('Setup done.')
