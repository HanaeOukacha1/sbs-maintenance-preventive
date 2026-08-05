from sqlalchemy import create_engine, text
engine = create_engine('mysql+pymysql://root:@localhost/sbs_db')
with engine.connect() as conn:
    users = conn.execute(text("SELECT id, email FROM users WHERE email IN ('hanae@sbs.ma', 'msante@sbs.ma')")).fetchall()
    
    for u in users:
        uid = u[0]
        # Delete current ANP missions for these users
        missions = conn.execute(text(f"SELECT id FROM missions WHERE technicien_id = {uid} AND site_id IN (SELECT id FROM sites WHERE checklist_type = 'ANP')")).fetchall()
        for m in missions:
            conn.execute(text(f"DELETE FROM missions WHERE id = {m[0]}"))
        conn.commit()
        
    if users:
        uid = users[0][0]
        # Assign ADM mission (ID=4) to the test user
        conn.execute(text(f"UPDATE missions SET technicien_id = {uid} WHERE id = 4"))
        conn.commit()
        print(f"ADM mission assigned to {users[0][1]}")
