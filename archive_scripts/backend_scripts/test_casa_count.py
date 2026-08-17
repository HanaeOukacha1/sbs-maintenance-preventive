# coding: utf-8
from sqlalchemy import create_engine, text
engine = create_engine('mysql+pymysql://root:@localhost/sbs_db')
count = engine.connect().execute(text("SELECT COUNT(*) FROM equipements WHERE site_id = (SELECT id FROM sites WHERE nom = 'CNDH CASABLANCA' LIMIT 1)")).scalar()
print("Count Casa:", count)
