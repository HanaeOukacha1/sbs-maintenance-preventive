import os
import sys
sys.path.append(os.getcwd())
from app.db.database import SessionLocal
from app.models.site import Site

db = SessionLocal()
site = db.query(Site).filter(Site.nom == 'MSANTE Rabat - DPRF').first()
print(type(site.feuilles))
print(site.feuilles)
