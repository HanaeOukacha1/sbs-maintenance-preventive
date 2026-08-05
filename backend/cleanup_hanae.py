from sqlalchemy import create_engine, text
engine = create_engine('mysql+pymysql://root:@localhost/sbs_db')
conn = engine.connect()

user_id = conn.execute(text("SELECT id FROM users WHERE email = 'hanae@sbs.ma'")).fetchone()
if user_id:
    uid = user_id[0]
    print(f"User ID: {uid}")
    
    # Get all missions to delete (excluding the new CNDH Siège which is site_id = 199)
    # Actually wait, let's just delete all missions for this user except the Siège one.
    # The new Siège site id is 199.
    
    conn.execute(text("DELETE FROM missions WHERE technicien_id = :uid AND site_id != 199"), {'uid': uid})
    conn.commit()
    print("Deleted other missions.")
    
    # Verify remaining missions
    res = conn.execute(text("SELECT id, titre, site_id FROM missions WHERE technicien_id = :uid"), {'uid': uid}).fetchall()
    print("Remaining missions:", res)
