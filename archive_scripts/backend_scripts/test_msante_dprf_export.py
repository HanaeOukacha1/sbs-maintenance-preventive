from app.db.database import SessionLocal
from app.models.site import Site
from app.models.mission import Mission
from app.models.equipement import Equipement
from app.services.export_service import exporter_mission

db = SessionLocal()
m = db.query(Mission).join(Site).filter(Site.nom == 'MSANTE DPRF').first()
if m:
    eqs = db.query(Equipement).filter(Equipement.site_id == m.site_id).all()
    buf, mt, fn = exporter_mission(m, [], eqs)
    with open('test_dprf_export.xlsx', 'wb') as f:
        f.write(buf.read())
    print(f"Exported {fn}")
else:
    print("Mission MSANTE DPRF not found")
