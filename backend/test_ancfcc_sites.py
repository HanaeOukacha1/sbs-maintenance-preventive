# coding: utf-8
from sqlalchemy import create_engine, text
engine = create_engine('mysql+pymysql://root:@localhost/sbs_db')
rows = engine.connect().execute(text("SELECT id, nom, ville FROM sites WHERE checklist_type = 'ANCFCC'")).fetchall()
for r in rows:
    print(r)
