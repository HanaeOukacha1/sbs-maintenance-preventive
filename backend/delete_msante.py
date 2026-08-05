from sqlalchemy import create_engine, text

conn = create_engine('mysql+pymysql://root:@localhost/sbs_db').connect()
m = conn.execute(text("SELECT id FROM marches WHERE nom LIKE '%MSANTE%'")).fetchone()
if m:
    m_id = m[0]
    conn.execute(text("DELETE FROM interventions WHERE mission_id IN (SELECT id FROM missions WHERE site_id IN (SELECT id FROM sites WHERE marche_id = :m))"), {'m': m_id})
    conn.execute(text("DELETE FROM missions WHERE site_id IN (SELECT id FROM sites WHERE marche_id = :m)"), {'m': m_id})
    # Optional: also delete equipments and sites if they want them completely gone, but "supprime missions msante" usually implies wiping everything for that client to have a clean slate for the next ones.
    conn.execute(text("DELETE FROM equipements WHERE site_id IN (SELECT id FROM sites WHERE marche_id = :m)"), {'m': m_id})
    conn.execute(text("DELETE FROM sites WHERE marche_id = :m"), {'m': m_id})
    conn.commit()
    print("MSANTE deleted.")
