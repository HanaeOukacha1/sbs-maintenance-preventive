import os
import sys
from datetime import date

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.database import SessionLocal
from app.models import User, RoleEnum, Site, Mission, StatutMissionEnum

def create_missions():
    db = SessionLocal()
    try:
        # Chercher Hanae
        hanae = db.query(User).filter(
            User.email == "hanae@example.com"
        ).first()

        if not hanae:
            print("Utilisateur Hanae Oukacha non trouvé !")
            # Créons-la si elle n'existe pas
            hanae = User(
                nom="Oukacha",
                prenom="Hanae",
                email="hanae@example.com",
                hashed_password="hash", # pas important juste pour la FK
                role=RoleEnum.TECHNICIEN
            )
            db.add(hanae)
            db.flush()
            print("Création de l'utilisateur de test réussie.")
        
        print(f"Technicien trouvé : {hanae.nom} (ID: {hanae.id})")

        # Récupérer tous les sites
        sites = db.query(Site).all()
        print(f"Nombre de sites trouvés : {len(sites)}")

        today_str = date.today().isoformat()
        count = 0

        for site in sites:
            # Vérifier si une mission existe déjà pour ce site aujourd'hui pour éviter les doublons massifs
            existing = db.query(Mission).filter(
                Mission.site_id == site.id,
                Mission.technicien_id == hanae.id,
                Mission.date_planifiee == today_str
            ).first()

            if not existing:
                m = Mission(
                    titre=f"Test Mission - {site.nom}",
                    site_id=site.id,
                    technicien_id=hanae.id,
                    date_planifiee=today_str,
                    statut=StatutMissionEnum.PLANIFIEE
                )
                db.add(m)
                count += 1

        db.commit()
        print(f"✅ {count} missions de test créées pour aujourd'hui !")

    except Exception as e:
        print(f"Erreur : {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_missions()
