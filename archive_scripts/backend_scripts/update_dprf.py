# -*- coding: utf-8 -*-
from app.db.database import SessionLocal
from app.models.equipement import Equipement

db = SessionLocal()
eqs = db.query(Equipement).filter(Equipement.site_id == 345).all()
tabs = ['Comptabilité', 'DPE', 'Budget', 'Planification', 'Administrative']
for i, e in enumerate(eqs):
    e.sous_site = tabs[i % len(tabs)]
    print(f"Eq {e.id} -> {e.sous_site}")

db.commit()
print("All done")
