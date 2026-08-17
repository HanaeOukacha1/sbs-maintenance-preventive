import sys
import os
from datetime import datetime, timedelta

# Add backend to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.database import SessionLocal
from app.models.user import User
from app.models.site import Site
from app.models.mission import Mission
from app.models.marche import Marche

def create_missions():
    db = SessionLocal()
    try:
        # 1. Get user Hanae Oukacha
        user = db.query(User).filter(User.prenom == 'Hanae', User.nom == 'Oukacha').first()
        if not user:
            print("User Hanae Oukacha not found, trying with email...")
            user = db.query(User).filter(User.email.like('hanae%sbs.ma')).first()
            if not user:
                print("User still not found! Please check the database.")
                return

        print(f"Found user: {user.prenom} {user.nom} (ID: {user.id})")

        # 2. Get all sites from the database
        sites_to_create_missions = db.query(Site).all()
        
        if not sites_to_create_missions:
            print("No sites found to create missions.")
            return

        # 3. Create missions
        created_count = 0
        today = datetime.now().date()
        
        for i, site in enumerate(sites_to_create_missions):
            mission = Mission(
                titre=f"Mission de Test {i+1} - {site.nom}",
                description=f"Test workflow pour le site {site.nom}",
                date_planifiee=today,
                statut="PLANIFIEE",
                site_id=site.id,
                technicien_id=user.id
            )
            db.add(mission)
            created_count += 1
            
        db.commit()
        print(f"Successfully created {created_count} missions for {user.email}.")

    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_missions()
