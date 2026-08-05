import os
import sys
import json
sys.path.append(os.getcwd())
from app.db.database import SessionLocal
from app.models.site import Site

db = SessionLocal()
site = db.query(Site).filter(Site.nom == 'MSANTE Rabat - DPRF').first()
if isinstance(site.feuilles, str):
    site.feuilles = json.loads(site.feuilles)
    db.commit()
    print("Fixed!")
else:
    print("Already fixed")
