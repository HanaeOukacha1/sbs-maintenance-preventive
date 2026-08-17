# coding: utf-8
import os
import pandas as pd
import math
import json
from sqlalchemy import create_engine, text
from datetime import date

# Database connection
engine = create_engine('mysql+pymysql://root:@localhost/sbs_db')
conn = engine.connect()

file_path = r'C:\Users\hanae\Desktop\Stage PFA 2026\MASTER DATA\CNDH\Siège S2 OK.XLS'

print("Deleting old Siège data...")
# Find site ID
site_id_res = conn.execute(text("SELECT id FROM sites WHERE nom LIKE 'CNDH Siège%'")).fetchone()
if site_id_res:
    site_id = site_id_res[0]
    conn.execute(text("DELETE FROM interventions WHERE equipement_id IN (SELECT id FROM equipements WHERE site_id = :sid)"), {'sid': site_id})
    conn.execute(text("DELETE FROM equipements WHERE site_id = :sid"), {'sid': site_id})
    conn.execute(text("DELETE FROM missions WHERE site_id = :sid"), {'sid': site_id})
    conn.execute(text("DELETE FROM sites WHERE id = :sid"), {'sid': site_id})
    conn.commit()

# Setup new site
site_nom = "CNDH Siège"
city_name = "RABAT"
marche_id = conn.execute(text("SELECT id FROM marches WHERE nom LIKE '%CNDH%' LIMIT 1")).fetchone()[0]
default_checklist = 'CNDH_SIEGE'
tech_id = 3 # Technicien

valid_sheets_names = ['SIEGE', 'IFHD', 'AGDAL']

feuilles_json = json.dumps(valid_sheets_names)

conn.execute(text(
    "INSERT INTO sites (nom, ville, marche_id, checklist_type, feuilles) "
    "VALUES (:nom, :ville, :marche_id, :ctype, :feuilles)"
), {'nom': site_nom, 'ville': city_name, 'marche_id': marche_id, 'ctype': default_checklist, 'feuilles': feuilles_json})
conn.commit()
site_id = conn.execute(text("SELECT LAST_INSERT_ID()")).fetchone()[0]
    
conn.execute(text(
    "INSERT INTO missions (titre, site_id, technicien_id, statut, date_planifiee) "
    "VALUES (:titre, :site_id, :tech, 'PLANIFIEE', CURDATE())"
), {'titre': f"MP {site_nom}", 'site_id': site_id, 'tech': tech_id})
conn.commit()

xls = pd.ExcelFile(file_path, engine='xlrd')

inserted = 0

for sheet_name in xls.sheet_names:
    if sheet_name.upper() not in valid_sheets_names:
        continue
        
    df = pd.read_excel(file_path, sheet_name=sheet_name, header=None)
    
    header_idx = None
    for i in range(min(20, len(df))):
        row = df.iloc[i]
        vals = [str(x).lower() for x in row.values]
        if any('marque' in v or 'mat' in v or 'desig' in v or 'article' in v for v in vals):
            header_idx = i
            break
            
    if header_idx is None:
        continue

    headers = [str(x).lower().strip() for x in df.iloc[header_idx].values]
    
    col_map = {}
    for idx, h in enumerate(headers):
        if 'entit' in h or 'site' in h: col_map['entite'] = idx
        elif 'emplacement' in h: col_map['emplacement'] = idx
        elif 'affectation' in h or 'utilisateur' in h: col_map['affectation'] = idx
        elif 'article' in h or 'mat' in h or 'desig' in h: col_map['article'] = idx
        elif 'marque' in h: col_map['marque'] = idx
        elif 'mod' in h: col_map['modele'] = idx
        elif 'serie' in h or 'série' in h: col_map['serie'] = idx
    
    if 'article' not in col_map and 'marque' not in col_map and 'serie' not in col_map:
        continue
        
    eqs_to_insert = []
    for _, row in df.iloc[header_idx+1:].iterrows():
        vals = row.values
        
        def get_val(key):
            if key in col_map and col_map[key] < len(vals):
                v = vals[col_map[key]]
                if pd.isna(v) or str(v).lower() == 'nan':
                    return None
                return str(v)[:100]
            return None

        article = get_val('article')
        marque = get_val('marque')
        modele = get_val('modele')
        serie = get_val('serie')
        
        if not article and not marque and not serie:
            continue
            
        entite = get_val('entite')
        emplacement = get_val('emplacement')
        affectation = get_val('affectation')
        
        # Correction logic
        if affectation and ('CRDH' in str(affectation).upper() or 'CNDH' in str(affectation).upper()):
            if not entite:
                entite = affectation
            affectation = None
            
        if emplacement and ('CRDH' in str(emplacement).upper() or 'CNDH' in str(emplacement).upper()):
            if not entite:
                entite = emplacement
            emplacement = None
            
        if entite and str(entite).upper() == 'STOCK':
            affectation = 'STOCK'
            entite = None
        
        type_eq = 'AUTRE'
        art_low = str(article).lower()
        if 'pc' in art_low or 'uc' in art_low or 'ecran' in art_low or 'ordinateur' in art_low:
            type_eq = 'PC'
        elif 'imprimante' in art_low or 'scanner' in art_low:
            type_eq = 'IMPRIMANTE'
        elif 'serveur' in art_low or 'switch' in art_low:
            type_eq = 'RESEAU'
            
        sous_site = sheet_name.upper()
            
        eqs_to_insert.append({
            'site_id': site_id,
            'sous_site': sous_site,
            'direction': entite,
            'bureau': emplacement,
            'utilisateur_nom': affectation,
            'type_equipement': type_eq,
            'designation': article,
            'marque': marque,
            'modele': modele,
            'numero_serie': serie
        })
        
    if eqs_to_insert:
        conn.execute(
            text("""
                INSERT INTO equipements 
                (site_id, sous_site, direction, bureau, utilisateur_nom, type_equipement, designation, marque, modele, numero_serie)
                VALUES 
                (:site_id, :sous_site, :direction, :bureau, :utilisateur_nom, :type_equipement, :designation, :marque, :modele, :numero_serie)
            """),
            eqs_to_insert
        )
        conn.commit()
        inserted += len(eqs_to_insert)

print(f"Done. Imported {inserted} equipments for CNDH Siège.")
