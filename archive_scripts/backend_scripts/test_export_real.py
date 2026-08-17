"""
Test d'export réel depuis la BD — génère un fichier de test dans /tmp
"""
import sys
sys.stdout.reconfigure(encoding='utf-8')

from app.db.database import engine
from app.models.mission import Mission
from app.models.intervention import Intervention
from app.models.equipement import Equipement
from app.services.export_service import exporter_mission
from sqlalchemy.orm import Session

with Session(engine) as db:
    # Chercher une mission ANP
    mission = db.query(Mission).join(Mission.site).filter(
        Mission.site.has(marche=None)
    ).first()
    
    # Chercher n'importe quelle mission avec des interventions
    missions = db.query(Mission).all()
    print(f"Missions en BD: {len(missions)}")
    
    for m in missions[:5]:
        if m.site and m.site.marche:
            print(f"  Mission ID={m.id} | Site={m.site.nom} | Marché={m.site.marche.nom}")
    
    # Prendre la première mission avec marché
    target = None
    for m in missions:
        if m.site and m.site.marche and m.site.marche.nom:
            interventions = db.query(Intervention).filter(Intervention.mission_id == m.id).all()
            if interventions:
                target = m
                break
    
    if not target:
        print("Aucune mission avec interventions trouvée!")
    else:
        print(f"\nTest export: Mission={target.id} | Marché={target.site.marche.nom}")
        interventions = db.query(Intervention).filter(Intervention.mission_id == target.id).all()
        equipements = db.query(Equipement).filter(Equipement.site_id == target.site_id).all()
        
        try:
            buffer, mime, filename = exporter_mission(target, interventions, equipements)
            with open(f"test_output_{filename}", "wb") as f:
                f.write(buffer.read())
            print(f"SUCCES! Fichier généré: test_output_{filename} ({len(buffer.getvalue()) if hasattr(buffer, 'getvalue') else '?'} bytes)")
        except Exception as e:
            import traceback
            print(f"ERREUR: {e}")
            traceback.print_exc()
