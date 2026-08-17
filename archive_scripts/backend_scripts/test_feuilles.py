# coding: utf-8
from sqlalchemy import create_engine, text
engine = create_engine('mysql+pymysql://root:@localhost/sbs_db')
rows = engine.connect().execute(text("SELECT nom, feuilles FROM sites WHERE checklist_type LIKE 'AMEE%'")).fetchall()
for r in rows:
    print(r)
