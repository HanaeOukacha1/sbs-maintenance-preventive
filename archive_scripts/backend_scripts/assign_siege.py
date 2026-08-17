from sqlalchemy import create_engine, text
engine = create_engine('mysql+pymysql://root:@localhost/sbs_db')
conn = engine.connect()
conn.execute(text("UPDATE missions SET technicien_id = 4 WHERE site_id = 199"))
conn.commit()
print("Assigned to Hanae")
