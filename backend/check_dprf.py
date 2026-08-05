import os
import sys
sys.path.append(os.getcwd())
from app.db.database import SessionLocal
from app.models.site import Site
from app.models.equipement import Equipement
import json

db = SessionLocal()
dprf_site = db.query(Site).filter(Site.nom.like('%DPRF%')).first()
if dprf_site:
    print(f"Site DPRF: {dprf_site.nom}, feuilles: {dprf_site.feuilles}")
    eqs = db.query(Equipement).filter(Equipement.site_id == dprf_site.id).all()
    print(f"Total equipments: {len(eqs)}")
    sous_sites = set([eq.sous_site for eq in eqs])
    print(f"Equipments sous_sites: {sous_sites}")
    
    # Let's fix the feuilles if they are missing
    if not dprf_site.feuilles:
        sheets = ['NV COMPTABILITE', 'NV DPE', 'NV BUDGET', 'NV SSERF,', 'NV SERVICE ECONOMIE SANITAIRE', 'NV SERVICE Planification', 'NV Admin']
        dprf_site.feuilles = json.dumps(sheets)
        db.commit()
        print("Updated feuilles for DPRF site")
        
    dprf_site.checklist_type = 'MSANTE_DPRF'
    db.commit()
else:
    print("DPRF site not found!")

capm_site = db.query(Site).filter(Site.nom.like('%CAPM%') | Site.nom.like('%Anti-Poisons%')).first()
if capm_site:
    print(f"Site CAPM: {capm_site.nom}")
    capm_site.checklist_type = 'MSANTE_CAPM'
    db.commit()
else:
    print("CAPM site not found!")
