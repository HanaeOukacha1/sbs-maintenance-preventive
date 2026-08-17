import os
import sys
sys.path.append(os.getcwd())
sys.stdout.reconfigure(encoding='utf-8')
from app.db.database import SessionLocal
from app.models.site import Site
from app.models.marche import Marche

db = SessionLocal()
msante_marche = db.query(Marche).filter(Marche.nom.like('%MSANTE%')).first()
sites = db.query(Site).filter(Site.marche_id == msante_marche.id).all()
for s in sites:
    print(f"Site ID: {s.id}, Nom: {s.nom}")
