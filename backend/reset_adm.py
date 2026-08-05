# coding: utf-8
from sqlalchemy import create_engine, text
engine = create_engine('mysql+pymysql://root:@localhost/sbs_db')
with engine.connect() as conn:
    users = conn.execute(text("SELECT id, email FROM users WHERE email IN ('hanae@sbs.ma', 'msante@sbs.ma')")).fetchall()
    if users:
        uid = users[0][0]
        # Assigner les missions de ce technicien a l'admin (id=1) pour nettoyer son ecran
        conn.execute(text(f"UPDATE missions SET technicien_id = 1 WHERE technicien_id = {uid}"))
        
        # Assigner uniquement la mission ADM (id=4) a l'utilisateur
        conn.execute(text(f"UPDATE missions SET technicien_id = {uid}, statut = 'PLANIFIEE' WHERE id = 4"))
        
        # Supprimer les interventions existantes pour repartir a zero
        conn.execute(text("DELETE FROM interventions WHERE mission_id = 4"))
        
        conn.commit()
        print(f"Missions reinitialisees. Mission ADM assignee a {users[0][1]}.")
