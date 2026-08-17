from sqlalchemy import create_engine, text

conn = create_engine('mysql+pymysql://root:@localhost/sbs_db').connect()

conn.execute(text("UPDATE sites SET nom = 'MSANTE Conseil de Santé' WHERE nom LIKE '%Conseil de sant%'"))
conn.execute(text("UPDATE missions SET titre = 'MP MSANTE Conseil de Santé' WHERE titre LIKE '%Conseil de sant%'"))
conn.commit()

print('Names updated successfully.')
