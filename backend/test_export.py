import os, sys, json, traceback
sys.path.append(os.path.abspath(r'C:\Users\hanae\Desktop\Stage PFA 2026\backend'))
from app.db.database import SessionLocal
from app.models.mission import Mission
from app.models.intervention import Intervention
from app.models.equipement import Equipement
from app.services.export_service import export_dynamic_excel

db = SessionLocal()
mission = db.query(Mission).filter(Mission.id == 502).first()
interventions = db.query(Intervention).filter(Intervention.mission_id == 502).all()
equipements = db.query(Equipement).filter(Equipement.site_id == mission.site_id).all()
# Do NOT close db before export - needed for lazy loads

try:
    buf, mime, fname = export_dynamic_excel(mission, interventions, equipements)
    # Save to disk so we can inspect it
    with open(r'C:\Users\hanae\Desktop\test_export.xlsx', 'wb') as f:
        f.write(buf.read())
    print("SUCCESS - saved to Desktop as test_export.xlsx")
    print("Filename:", fname)
    print("Size: %d bytes" % buf.tell() if hasattr(buf, 'tell') else "unknown")
except Exception as e:
    traceback.print_exc()
