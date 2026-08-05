# coding: utf-8
from sqlalchemy import create_engine, text

engine = create_engine('mysql+pymysql://root:@localhost/sbs_db', pool_pre_ping=True)
tech_id = 4  # hanae@sbs.ma

with engine.connect() as conn:
    # 1. Supprimer toutes les missions (et interventions liées)
    conn.execute(text("DELETE FROM interventions WHERE mission_id IN (SELECT id FROM missions)"))
    conn.execute(text("DELETE FROM missions"))
    conn.commit()
    print("Toutes les missions supprimées.")

    # 2. Affecter uniquement ADM et AMEE
    marchés = ['ADM', 'AMEE_MARRAKECH', 'AMEE_RABAT']
    for ctype in marchés:
        sites = conn.execute(text(f"SELECT id, nom FROM sites WHERE checklist_type = '{ctype}'")).fetchall()
        for site_id, site_nom in sites:
            conn.execute(text(
                "INSERT INTO missions (titre, site_id, technicien_id, statut, date_planifiee) "
                "VALUES (:titre, :sid, :tid, 'PLANIFIEE', CURDATE())"
            ), {'titre': f"MP {site_nom}", 'sid': site_id, 'tid': tech_id})
        conn.commit()
        print(f"  {ctype}: {len(sites)} mission(s) créée(s)")

    # Vérification
    total = conn.execute(text("SELECT COUNT(*) FROM missions WHERE technicien_id = :t"), {'t': tech_id}).fetchone()[0]
    print(f"\nTotal missions affectées à hanae: {total}")
    rows = conn.execute(text(
        "SELECT m.titre, s.checklist_type FROM missions m JOIN sites s ON m.site_id = s.id WHERE m.technicien_id = :t"
    ), {'t': tech_id}).fetchall()
    for r in rows:
        print(f"  - {r[0]} ({r[1]})")
