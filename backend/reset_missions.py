import os
import sys
import pandas as pd
sys.path.append(os.getcwd())
sys.stdout.reconfigure(encoding='utf-8')
from app.db.database import SessionLocal
from app.models.site import Site
from app.models.equipement import Equipement
from app.models.marche import Marche
from app.models.user import User
from app.models.mission import Mission
from app.models.intervention import Intervention
import datetime
import json

db = SessionLocal()
msante_marche = db.query(Marche).filter(Marche.nom.like('%MSANTE%')).first()
user = db.query(User).filter(User.email == 'hanae@sbs.ma').first()
master_dir = r'C:\Users\hanae\Desktop\Stage PFA 2026\MASTER DATA\MSANTE'

print('Deleting all interventions and missions for user:', user.email)
missions = db.query(Mission).filter(Mission.technicien_id == user.id).all()
mission_ids = [m.id for m in missions]

if mission_ids:
    db.query(Intervention).filter(Intervention.mission_id.in_(mission_ids)).delete(synchronize_session=False)
    db.query(Mission).filter(Mission.id.in_(mission_ids)).delete(synchronize_session=False)
    db.commit()

def process_msante_excel(filename, site_name, checklist_type):
    print(f"Processing {site_name} as {checklist_type}...")
    site = db.query(Site).filter(Site.nom == site_name).first()
    if not site:
        site = Site(
            nom=site_name,
            ville='Rabat',
            marche_id=msante_marche.id,
            checklist_type=checklist_type
        )
        db.add(site)
        db.commit()
        db.refresh(site)
    else:
        site.checklist_type = checklist_type
        db.commit()
        
    db.query(Equipement).filter(Equipement.site_id == site.id).delete()
    db.commit()
    
    path = os.path.join(master_dir, filename)
    xls = pd.ExcelFile(path)
    sheets = xls.sheet_names
    
    if checklist_type == 'MSANTE_DPRF':
        site.feuilles = json.dumps(sheets)
        db.commit()
    
    for sheet in sheets:
        df = pd.read_excel(xls, sheet_name=sheet, header=None)
        
        for idx, row in df.iterrows():
            if idx < 8: continue
            if len(row) < 2 or pd.isna(row.iloc[0]) or str(row.iloc[0]).strip() == '' or 'signature' in str(row.iloc[0]).lower(): continue
            
            def get_val(i):
                if i < len(row) and pd.notna(row.iloc[i]):
                    return str(row.iloc[i])
                return ""
                
            if checklist_type == 'MSANTE_CAPM':
                des = get_val(1)
                if 'signature' in des.lower() or not des: continue
                mar = get_val(2)
                uti = get_val(3)
                art = get_val(5)
                ns  = get_val(6)
                eq = Equipement(nom=des, designation=des, marque=mar, modele=art, numero_serie=ns, utilisateur_nom=uti, site_id=site.id)
                db.add(eq)
                
            elif checklist_type == 'MSANTE_DPRF':
                des = get_val(1)
                if 'signature' in des.lower() or not des: continue
                uti = get_val(2)
                mar = get_val(4)
                art = get_val(5)
                ns  = get_val(6)
                eq = Equipement(nom=des, designation=des, marque=mar, modele=art, numero_serie=ns, utilisateur_nom=uti, site_id=site.id, sous_site=sheet)
                db.add(eq)
                
            else: # STANDARD
                des = get_val(1)
                if 'signature' in des.lower() or not des: continue
                mar = get_val(2)
                art = get_val(3)
                ns  = get_val(4)
                eq = Equipement(nom=des, designation=des, marque=mar, modele=art, numero_serie=ns, site_id=site.id)
                db.add(eq)
                
    db.commit()
    
    mission = Mission(
        titre=f"Visite préventive - {site_name}",
        description=f"Test complet {checklist_type}",
        date_planifiee=datetime.date.today(),
        statut="Planifiée",
        technicien_id=user.id,
        site_id=site.id
    )
    db.add(mission)
    db.commit()

process_msante_excel('BUREAU ORDRE S2.XLS', 'MSANTE Rabat - BUREAU ORDRE', 'MSANTE_STANDARD')
process_msante_excel('CAPM S2.XLS', 'MSANTE Rabat - CAPM', 'MSANTE_CAPM')
process_msante_excel('DPRF S2.XLS', 'MSANTE Rabat - DPRF', 'MSANTE_DPRF')

print("All imports done successfully!")

