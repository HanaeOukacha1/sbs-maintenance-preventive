import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.database import SessionLocal
from sqlalchemy import text

def clean_db():
    db = SessionLocal()
    try:
        # We execute raw sql to bypass any enum restrictions that might exist later
        db.execute(text("UPDATE missions SET statut = 'PLANIFIEE' WHERE statut = 'EN_COURS'"))
        db.commit()
        print("Missions updated successfully!")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    clean_db()
