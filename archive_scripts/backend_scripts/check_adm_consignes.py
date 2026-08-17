from sqlalchemy import create_engine, text
engine = create_engine('mysql+pymysql://root:@localhost/sbs_db')
with engine.connect() as conn:
    # Check if there is anything about consignes in DB or in code
    pass
