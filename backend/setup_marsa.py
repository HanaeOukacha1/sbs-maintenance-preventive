# coding: utf-8
from sqlalchemy import create_engine, text
engine = create_engine('mysql+pymysql://root:@localhost/sbs_db', pool_pre_ping=True)
with engine.connect() as conn:
    # Assign mission 24 to hanae
    conn.execute(text("UPDATE missions SET technicien_id = 1 WHERE technicien_id = 4"))
    conn.commit()
    conn.execute(text("UPDATE missions SET technicien_id = 4, statut = 'PLANIFIEE' WHERE id = 24"))
    conn.commit()
    conn.execute(text("DELETE FROM interventions WHERE mission_id = 24"))
    conn.commit()
    print("Marsa Maroc mission 24 assigned.")
    
    # Check what's really in the famille/modele/utilisateur_nom fields
    sample = conn.execute(text(
        "SELECT id, direction, bureau, famille, marque, modele, numero_serie, utilisateur_nom, cpu, ram, disque_dur, systeme_exploitation "
        "FROM equipements WHERE site_id = 112 LIMIT 6"
    )).fetchall()
    print("Sample EQ:")
    for e in sample:
        print(" ", e)
    count = conn.execute(text("SELECT COUNT(*) FROM equipements WHERE site_id = 112")).fetchone()
    print(f"Total: {count[0]}")
