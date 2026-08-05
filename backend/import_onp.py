import pandas as pd
from sqlalchemy import create_engine, text
import math
import os

engine = create_engine('mysql+pymysql://root:@localhost/sbs_db')
conn = engine.connect()

def is_nan(val):
    if pd.isna(val): return True
    if isinstance(val, float) and math.isnan(val): return True
    if str(val).strip() == "" or str(val).strip().lower() == "nan": return True
    return False

# 1. Obtenir marche_id et tech_id
marche = conn.execute(text("SELECT id, nom FROM marches WHERE nom LIKE '%ONP%' LIMIT 1")).fetchone()
if not marche:
    print("Marche ONP non trouvé, création...")
    conn.execute(text("INSERT INTO marches (nom, client, date_debut, date_fin, is_active) VALUES ('ONP 37/2024', 'ONP', '2024-01-01', '2025-12-31', 1)"))
    conn.commit()
    marche_id = conn.execute(text("SELECT LAST_INSERT_ID()")).fetchone()[0]
else:
    marche_id = marche[0]

tech = conn.execute(text("SELECT id FROM users WHERE role = 'TECHNICIEN' LIMIT 1")).fetchone()
tech_id = tech[0] if tech else 1

# 2. Nettoyage précédent (Uniquement ONP)
print("Suppression des anciennes missions ONP...")
conn.execute(text("DELETE FROM interventions WHERE mission_id IN (SELECT id FROM missions WHERE site_id IN (SELECT id FROM sites WHERE marche_id = :m))"), {'m': marche_id})
conn.execute(text("DELETE FROM missions WHERE site_id IN (SELECT id FROM sites WHERE marche_id = :m)"), {'m': marche_id})
conn.execute(text("DELETE FROM equipements WHERE site_id IN (SELECT id FROM sites WHERE marche_id = :m)"), {'m': marche_id})
conn.execute(text("DELETE FROM sites WHERE marche_id = :m"), {'m': marche_id})
conn.commit()

# 3. Traitement du fichier
file_path = r"C:\Users\hanae\Desktop\Stage PFA 2026\MASTER DATA\ONP\MP ONP.xlsx"

print("Traitement de ONP...")
df = pd.read_excel(file_path, header=7)

sites_cache = {} # site_nom -> site_id

eq_count = 0
for idx, row in df.iterrows():
    if is_nan(row.get('SITE')):
        continue
    
    site_raw = str(row['SITE']).strip()
    site_nom = f"ONP {site_raw}"
    
    if site_nom not in sites_cache:
        # Create site
        conn.execute(text(
            "INSERT INTO sites (nom, ville, marche_id, checklist_type) "
            "VALUES (:nom, :ville, :marche_id, 'ONP')"
        ), {'nom': site_nom, 'ville': site_raw, 'marche_id': marche_id})
        conn.commit()
        site_id = conn.execute(text("SELECT LAST_INSERT_ID()")).fetchone()[0]
        
        # Create mission
        conn.execute(text(
            "INSERT INTO missions (titre, site_id, technicien_id, statut, date_planifiee) "
            "VALUES (:titre, :site_id, :tech, 'PLANIFIEE', CURDATE())"
        ), {'titre': f"MP {site_nom}", 'site_id': site_id, 'tech': tech_id})
        conn.commit()
        
        sites_cache[site_nom] = site_id
        
    site_id = sites_cache[site_nom]
    
    designation = str(row.get('DESIGNATION', '')).strip() if not is_nan(row.get('DESIGNATION')) else ''
    marque = str(row.get('MARQUE', '')).strip() if not is_nan(row.get('MARQUE')) else ''
    modele = str(row.get('MODELE', '')).strip() if not is_nan(row.get('MODELE')) else ''
    
    sn_val = ''
    for col in df.columns:
        if 'SERIE' in str(col).upper():
            sn_val = row[col]
            break
            
    sn = str(sn_val).strip() if not is_nan(sn_val) else ''
    
    conn.execute(text(
        "INSERT INTO equipements (site_id, designation, marque, modele, numero_serie) "
        "VALUES (:site, :desig, :marque, :modele, :sn)"
    ), {
        'site': site_id,
        'desig': designation,
        'marque': marque,
        'modele': modele,
        'sn': sn
    })
    eq_count += 1
    
conn.commit()

print(f"Terminé. Importé {eq_count} équipements répartis sur {len(sites_cache)} sites/missions pour ONP.")
