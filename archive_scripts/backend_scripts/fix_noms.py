# coding: utf-8
from sqlalchemy import create_engine, text
engine = create_engine('mysql+pymysql://root:@localhost/sbs_db', pool_pre_ping=True)
with engine.connect() as conn:
    conn.execute(text("UPDATE equipements SET nom = COALESCE(famille, type_equipement, 'Equipement') WHERE nom IS NULL"))
    conn.commit()
    print('Fixed noms')
