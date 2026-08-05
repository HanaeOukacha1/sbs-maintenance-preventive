# coding: utf-8
from sqlalchemy import create_engine, text
import json

engine = create_engine('mysql+pymysql://root:@localhost/sbs_db')
with engine.connect() as conn:
    # Check existing AMEE sites
    sites = conn.execute(text("SELECT id, nom, checklist_type, feuilles FROM sites WHERE checklist_type LIKE 'AMEE%'")).fetchall()
    print('AMEE sites:', sites)
    
    # Check equipment columns available
    cols = conn.execute(text("SHOW COLUMNS FROM equipements")).fetchall()
    col_names = [c[0] for c in cols]
    print('Equipment cols:', col_names)
