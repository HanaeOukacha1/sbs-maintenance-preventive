from sqlalchemy import create_engine, text
engine = create_engine('mysql+pymysql://root:@localhost/sbs_db')
with engine.connect() as conn:
    # Get user id for hanae@sbs.ma and msante@sbs.ma
    users = conn.execute(text("SELECT id, email FROM users WHERE email IN ('hanae@sbs.ma', 'msante@sbs.ma', 'tech1@sbs.ma')")).fetchall()
    print('Users:', users)
    
    # Delete current MSANTE missions for these users
    for u in users:
        uid = u[0]
        # Get missions to delete
        missions = conn.execute(text(f"SELECT id FROM missions WHERE technicien_id = {uid} AND site_id IN (SELECT id FROM sites WHERE checklist_type LIKE 'MSANTE%')")).fetchall()
        for m in missions:
            conn.execute(text(f"DELETE FROM missions WHERE id = {m[0]}"))
        conn.commit()
        
    # Assign ANP missions to the first user found (e.g. hanae@sbs.ma)
    if users:
        uid = users[0][0]
        email = users[0][1]
        print(f"Assigning ANP missions to {email} (ID: {uid})")
        conn.execute(text(f"UPDATE missions SET technicien_id = {uid} WHERE id IN (20, 21)"))
        conn.commit()
        print("ANP missions assigned successfully.")
        
