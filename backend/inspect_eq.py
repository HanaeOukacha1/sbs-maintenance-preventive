import os
import sys
sys.path.append(os.getcwd())
from app.db.database import SessionLocal
from app.models.equipement import Equipement

db = SessionLocal()
eqs = db.query(Equipement).filter(Equipement.site_id == 95).all()
for eq in eqs:
    print(f'Id: {eq.id} - entite: {eq.entite} - sous_site: {eq.sous_site} - affectation: {eq.affectation} - direction: {eq.direction}')
