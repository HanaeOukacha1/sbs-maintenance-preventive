from sqlalchemy import create_engine, text
engine = create_engine('mysql+pymysql://root:@localhost/sbs_db')
res = engine.connect().execute(text("SELECT id, titre, site_id, statut FROM missions")).fetchall()
for r in res:
    if 'Si' in r[1]:
        print(r)
