# coding: utf-8
from sqlalchemy import create_engine, text
import openpyxl

engine = create_engine('mysql+pymysql://root:@localhost/sbs_db', pool_pre_ping=True)

wb = openpyxl.load_workbook(
    r'C:\Users\hanae\Desktop\Stage PFA 2026\MASTER DATA\ONP\MP ONP.xlsx',
    data_only=True
)

ws = wb['Feuil1']

with engine.connect() as conn:
    marche_id = conn.execute(text("SELECT id FROM marches WHERE nom LIKE '%ONP%' LIMIT 1")).fetchone()
    marche_id = marche_id[0] if marche_id else 22
    tech_id = 4
    
    sites_dict = {}
    for row in ws.iter_rows(min_row=6, values_only=True):
        if not any(row):
            continue
        site = str(row[1]).strip() if row[1] else None
        if not site or site == 'None' or site.lower() == 'site':
            continue
            
        designation = str(row[2]).strip() if row[2] else None
        marque = str(row[3]).strip() if row[3] else None
        modele = str(row[4]).strip() if row[4] else None
        serie = str(row[5]).strip() if row[5] else None
        
        if not sites_dict.get(site):
            sites_dict[site] = []
            
        sites_dict[site].append({
            'designation': designation,
            'marque': marque,
            'modele': modele,
            'serie': serie
        })
        
    print(f"Found {len(sites_dict)} sites in Excel.")

    # Properly delete 'ONP SITE' if it exists
    site_to_del = conn.execute(text("SELECT id FROM sites WHERE nom = 'ONP SITE'")).fetchone()
    if site_to_del:
        conn.execute(text(f"DELETE FROM equipements WHERE site_id = {site_to_del[0]}"))
        conn.execute(text(f"DELETE FROM interventions WHERE mission_id IN (SELECT id FROM missions WHERE site_id = {site_to_del[0]})"))
        conn.execute(text(f"DELETE FROM missions WHERE site_id = {site_to_del[0]}"))
        conn.execute(text(f"DELETE FROM sites WHERE id = {site_to_del[0]}"))
        conn.commit()

    count_processed = 0
    for site_name, equipments in sites_dict.items():
        nom_complet = f"ONP {site_name}"
        
        # Check if site exists
        site_db = conn.execute(text("SELECT id FROM sites WHERE nom = :nom AND checklist_type = 'ONP'"), {'nom': nom_complet}).fetchone()
        if site_db:
            site_id = site_db[0]
        else:
            conn.execute(text(
                "INSERT INTO sites (nom, ville, marche_id, checklist_type) "
                "VALUES (:nom, :ville, :marche_id, 'ONP')"
            ), {'nom': nom_complet, 'ville': site_name, 'marche_id': marche_id})
            conn.commit()
            site_id = conn.execute(text("SELECT LAST_INSERT_ID()")).fetchone()[0]
            
        # Check mission
        mission_db = conn.execute(text("SELECT id FROM missions WHERE site_id = :site_id"), {'site_id': site_id}).fetchone()
        if mission_db:
            mission_id = mission_db[0]
            conn.execute(text("UPDATE missions SET technicien_id = :tech, statut = 'PLANIFIEE' WHERE id = :mid"), {'tech': tech_id, 'mid': mission_id})
            conn.commit()
            conn.execute(text(f"DELETE FROM interventions WHERE mission_id = {mission_id}"))
            conn.commit()
        else:
            conn.execute(text(
                "INSERT INTO missions (titre, site_id, technicien_id, statut, date_planifiee) "
                "VALUES (:titre, :site_id, :tech, 'PLANIFIEE', CURDATE())"
            ), {'titre': f"MP ONP {site_name}", 'site_id': site_id, 'tech': tech_id})
            conn.commit()
            mission_id = conn.execute(text("SELECT LAST_INSERT_ID()")).fetchone()[0]
            
        # Insert equipments if none exists
        count_eq = conn.execute(text("SELECT COUNT(*) FROM equipements WHERE site_id = :site_id"), {'site_id': site_id}).fetchone()[0]
        if count_eq == 0:
            for eq in equipments:
                type_eq = 'AUTRE'
                desig_low = str(eq['designation']).lower()
                if 'pc' in desig_low or 'ecran' in desig_low or 'bureau' in desig_low or 'portable' in desig_low:
                    type_eq = 'PC'
                elif 'imprimante' in desig_low or 'scanner' in desig_low:
                    type_eq = 'IMPRIMANTE'
                elif 'serveur' in desig_low or 'switch' in desig_low or 'onduleur' in desig_low or 'baie' in desig_low or 'nas' in desig_low:
                    type_eq = 'RESEAU'
                
                conn.execute(text(
                    "INSERT INTO equipements (site_id, designation, marque, modele, numero_serie, type_equipement, is_active) "
                    "VALUES (:site_id, :desig, :marque, :modele, :serie, :type_eq, 1)"
                ), {
                    'site_id': site_id,
                    'desig': eq['designation'] if str(eq['designation']) != 'None' else None,
                    'marque': eq['marque'] if str(eq['marque']) != 'None' else None,
                    'modele': eq['modele'] if str(eq['modele']) != 'None' else None,
                    'serie': eq['serie'] if str(eq['serie']) != 'None' else None,
                    'type_eq': type_eq
                })
            conn.commit()
        count_processed += 1
        
    print(f"Done. Processed {count_processed} ONP sites (missions + equipments) for hanae.")
