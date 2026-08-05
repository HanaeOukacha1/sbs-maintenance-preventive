# -*- coding: utf-8 -*-
import os
import sys
import datetime
sys.path.append(os.getcwd())
from app.db.database import SessionLocal
from app.models.user import User
from app.models.site import Site
from app.models.marche import Marche
from app.models.mission import Mission

db = SessionLocal()

# Find the user
user = db.query(User).filter(User.email == 'hanae@sbs.ma').first()
if not user:
    print("User hanae@sbs.ma not found!")
    sys.exit(1)

# Find MSANTE sites
msante_marche = db.query(Marche).filter(Marche.nom.like('%MSANTE%')).first()
msante_sites = db.query(Site).filter(Site.marche_id == msante_marche.id).all()

count = 0
for site in msante_sites: # Create missions for all msante sites (there's only a few)
    existing = db.query(Mission).filter(Mission.site_id == site.id, Mission.technicien_id == user.id).first()
    if not existing:
        new_mission = Mission(
            titre=f"Visite preventive - {site.nom}",
            description=f"Test MSANTE",
            date_planifiee=datetime.date.today(),
            statut="Planifiée",
            technicien_id=user.id,
            site_id=site.id,
            checklist_type="MSANTE_STANDARD"
        )
        db.add(new_mission)
        count += 1
    else:
        existing.statut = "Planifiée" # Reset it

db.commit()
print(f"Created/Updated {count} MSANTE missions for {user.email}.")
