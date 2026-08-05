# coding: utf-8
from sqlalchemy import create_engine, text
engine = create_engine('mysql+pymysql://root:@localhost/sbs_db', pool_pre_ping=True)
with engine.connect() as conn:
    # Check all MHAI sites and missions
    sites = conn.execute(text("SELECT id, nom FROM sites WHERE checklist_type = 'MHAI'")).fetchall()
    mission_ids = []
    for s in sites:
        m = conn.execute(text(f"SELECT id FROM missions WHERE site_id = {s[0]}")).fetchall()
        for mi in m:
            mission_ids.append(mi[0])
    print('All MHAI site_ids:', [s[0] for s in sites])
    print('All MHAI mission_ids:', mission_ids)
    
    # Also check if Tanger, Marrakech, Casa have sites
    extra = conn.execute(text("SELECT id, nom, checklist_type FROM sites WHERE nom LIKE '%MHAI%' OR nom LIKE '%Habous%'")).fetchall()
    print('All Habous sites:', extra)
    
    # Sample equipment from site 113
    sample = conn.execute(text(
        "SELECT id, famille, marque, modele, numero_serie, numero_inventaire, type_equipement "
        "FROM equipements WHERE site_id = 113 LIMIT 5"
    )).fetchall()
    print('MHAI Sale sample:', sample)
    
    # Assign all MHAI missions to hanae
    conn.execute(text("UPDATE missions SET technicien_id = 1 WHERE technicien_id = 4"))
    conn.commit()
    for mid in mission_ids:
        conn.execute(text(f"UPDATE missions SET technicien_id = 4, statut = 'PLANIFIEE' WHERE id = {mid}"))
    conn.commit()
    for mid in mission_ids:
        conn.execute(text(f"DELETE FROM interventions WHERE mission_id = {mid}"))
    conn.commit()
    print(f'Assigned {len(mission_ids)} MHAI missions to hanae.')
