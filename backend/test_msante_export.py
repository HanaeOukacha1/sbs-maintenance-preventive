import os
import sys
sys.path.append(os.getcwd())
from app.db.database import SessionLocal
from app.models.mission import Mission
from app.models.intervention import Intervention
from app.models.equipement import Equipement
from app.services.export_service import export_msante

db = SessionLocal()
mission = db.query(Mission).filter(Mission.id == 70).first() 

if mission:
    interventions = db.query(Intervention).filter(Intervention.mission_id == mission.id).all()
    equipements = db.query(Equipement).filter(Equipement.site_id == mission.site_id).all()
    try:
        buffer, mime, name = export_msante(mission, interventions, equipements)
        with open('test_msante_out2.xlsx', 'wb') as f:
            f.write(buffer.getvalue())
        print('SUCCESS:', name)
    except Exception as e:
        print('EXPORT ERROR:', str(e))
else:
    print('MISSION NOT FOUND')
