# coding: utf-8
from sqlalchemy import create_engine, text
engine = create_engine('mysql+pymysql://root:@localhost/sbs_db', pool_pre_ping=True)
with engine.connect() as conn:
    conn.execute(text("UPDATE missions SET technicien_id = 1 WHERE technicien_id = 4"))
    conn.commit()
    conn.execute(text("UPDATE missions SET technicien_id = 4, statut = 'PLANIFIEE' WHERE id = 23"))
    conn.commit()
    conn.execute(text("DELETE FROM interventions WHERE mission_id = 23"))
    conn.commit()
    print("INPPLC mission 23 assigned to hanae@sbs.ma.")
    count_imp = conn.execute(text("SELECT COUNT(*) FROM equipements WHERE site_id = 111 AND sous_site = 'Imprimantes'")).fetchone()
    count_pc = conn.execute(text("SELECT COUNT(*) FROM equipements WHERE site_id = 111 AND sous_site = 'PC Portables'")).fetchone()
    print(f"Imprimantes: {count_imp[0]}, PC Portables: {count_pc[0]}")
