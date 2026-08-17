from sqlalchemy import create_engine, text
engine = create_engine('mysql+pymysql://root:@localhost:3306/sbs_db')
conn = engine.connect()
conn.execute(text("UPDATE equipements SET type_equipement = 'AUTRE' WHERE type_equipement = '' OR type_equipement IS NULL"))
conn.commit()
print("Done")
