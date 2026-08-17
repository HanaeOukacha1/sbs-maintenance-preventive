# coding: utf-8
from sqlalchemy import create_engine, text
engine = create_engine('mysql+pymysql://root:@localhost/sbs_db', pool_pre_ping=True)
with engine.connect() as conn:
    # Assign mission 22 (AOH) to hanae@sbs.ma (uid=4), clean up others
    conn.execute(text("UPDATE missions SET technicien_id = 1 WHERE technicien_id = 4"))
    conn.commit()
    conn.execute(text("UPDATE missions SET technicien_id = 4, statut = 'PLANIFIEE' WHERE id = 22"))
    conn.commit()
    conn.execute(text("DELETE FROM interventions WHERE mission_id = 22"))
    conn.commit()
    print("AOH mission 22 assigned to hanae@sbs.ma.")
    
    # Verify equipment has the needed fields
    sample = conn.execute(text(
        "SELECT id, designation, marque, modele, numero_serie, numero_inventaire FROM equipements WHERE site_id = 110 LIMIT 8"
    )).fetchall()
    print("AOH EQ sample:")
    for e in sample:
        print(" ", e)
    count = conn.execute(text("SELECT COUNT(*) FROM equipements WHERE site_id = 110")).fetchone()
    print(f"Total AOH equipment: {count[0]}")
