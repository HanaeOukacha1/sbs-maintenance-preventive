# coding: utf-8
from sqlalchemy import create_engine, text

engine = create_engine('mysql+pymysql://root:@localhost/sbs_db', pool_pre_ping=True)
tech_id = 4  # hanae@sbs.ma

with engine.connect() as conn:
    # 1. Supprimer toutes les missions (et interventions liées)
    conn.execute(text("DELETE FROM interventions WHERE mission_id IN (SELECT id FROM missions)"))
    conn.execute(text("DELETE FROM missions"))
    conn.commit()
    print("Anciennes missions supprimées.")

    # 2. Affecter uniquement ANCFCC
    sites = conn.execute(text("SELECT id, nom, ville FROM sites WHERE checklist_type = 'ANCFCC'")).fetchall()
    
    for site_id, nom, ville in sites:
        conn.execute(text(
            "INSERT INTO missions (titre, site_id, technicien_id, statut, date_planifiee) "
            "VALUES (:titre, :sid, :tid, 'PLANIFIEE', CURDATE())"
        ), {'titre': f"MP ANCFCC {ville or nom}", 'sid': site_id, 'tid': tech_id})
    conn.commit()
    print(f"ANCFCC: {len(sites)} mission(s) créée(s)")

    # Vérification
    total = conn.execute(text("SELECT COUNT(*) FROM missions WHERE technicien_id = :t"), {'t': tech_id}).fetchone()[0]
    print(f"\nTotal missions affectées à hanae: {total}")
