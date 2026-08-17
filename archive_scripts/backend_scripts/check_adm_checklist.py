from sqlalchemy import create_engine, text
engine = create_engine('mysql+pymysql://root:@localhost/sbs_db')
with engine.connect() as conn:
    # check fields for ADM
    res = conn.execute(text("SELECT id, designation, marque, modele, numero_serie, cpu, ram, disque_dur, ip FROM equipements WHERE site_id = 92 LIMIT 1")).fetchone()
    print('ADM EQ:', res)
