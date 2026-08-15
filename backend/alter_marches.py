from app.db.database import engine
from sqlalchemy import text

def alter_table():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE marches ADD COLUMN logo_url VARCHAR(255);"))
        except Exception as e:
            print(e)
            
        try:
            conn.execute(text("ALTER TABLE marches ADD COLUMN numero VARCHAR(100);"))
        except Exception as e:
            print(e)
            
        try:
            conn.execute(text("ALTER TABLE marches ADD COLUMN informations_entete TEXT;"))
        except Exception as e:
            print(e)
            
        conn.commit()
        print("Alter table success")

if __name__ == "__main__":
    alter_table()
