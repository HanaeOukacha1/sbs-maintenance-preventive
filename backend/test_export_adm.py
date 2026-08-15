import sys
sys.path.append('.')
from app.db.database import SessionLocal
from app.models.mission import Mission
from app.models.intervention import Intervention
from app.models.equipement import Equipement
from app.services.export_service import exporter_mission
from sqlalchemy import text

db = SessionLocal()

# Trouver les missions ADM
rows = db.execute(text(
    "SELECT m.id, m.titre FROM missions m "
    "JOIN sites s ON m.site_id = s.id "
    "JOIN marches mc ON s.marche_id = mc.id "
    "WHERE mc.nom LIKE '%ADM%' LIMIT 5"
)).fetchall()

print("ADM missions:")
for r in rows:
    mission_id = r[0]
    titre = r[1]
    nb_interv = db.execute(text(f"SELECT COUNT(*) FROM interventions WHERE mission_id = {mission_id}")).scalar()
    print(f"  ID:{mission_id} | {titre} | {nb_interv} interventions")

if rows:
    # Tester l'export sur la première mission ADM avec interventions
    for r in rows:
        mission_id = r[0]
        nb = db.execute(text(f"SELECT COUNT(*) FROM interventions WHERE mission_id = {mission_id}")).scalar()
        if nb > 0:
            print(f"\nTest export mission {mission_id}...")
            try:
                mission = db.query(Mission).get(mission_id)
                interventions = db.query(Intervention).filter(Intervention.mission_id == mission_id).all()
                equipements = db.query(Equipement).filter(Equipement.site_id == mission.site_id).all()
                buf, mime, fname = exporter_mission(mission, interventions, equipements)
                print(f"OK! mime={mime}, filename={fname}, size={len(buf.getvalue())} bytes")
            except Exception as e:
                import traceback
                print(f"ERREUR: {e}")
                traceback.print_exc()
            break

db.close()
