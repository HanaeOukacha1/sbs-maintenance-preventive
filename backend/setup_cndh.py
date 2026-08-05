# coding: utf-8
from sqlalchemy import create_engine, text
import pandas as pd
import os

engine = create_engine('mysql+pymysql://root:@localhost/sbs_db', pool_pre_ping=True)
folder = r'C:\Users\hanae\Desktop\Stage PFA 2026\MASTER DATA\CNDH'

with engine.connect() as conn:
    # Check if marche exists
    marche_id = 11 # Default fallback
    marche_db = conn.execute(text("SELECT id FROM marches WHERE nom LIKE '%CNDH%' LIMIT 1")).fetchone()
    if marche_db:
        marche_id = marche_db[0]
    else:
        site_m = conn.execute(text("SELECT marche_id FROM sites WHERE checklist_type LIKE 'CNDH%' LIMIT 1")).fetchone()
        if site_m:
            marche_id = site_m[0]
            
    tech_id = 4 # hanae

    processed_sites = 0
    total_equipments = 0

    for filename in os.listdir(folder):
        if not filename.upper().endswith('.XLS'):
            continue
            
        filepath = os.path.join(folder, filename)
        is_siege = 'Siège' in filename or 'SIEGE' in filename.upper()
        default_checklist = 'CNDH_SIEGE' if is_siege else 'CNDH_G1'
        
        city_name = filename.upper().replace(' S2', '').replace(' OK', '').replace(' MODIFIER', '').replace('.XLS', '').strip()
        
        try:
            xl = pd.ExcelFile(filepath)
            for sheet in xl.sheet_names:
                df = xl.parse(sheet)
                
                # Find header row
                header_idx = None
                for i, row in df.head(10).iterrows():
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
                
                # Site name logic:
                if len(xl.sheet_names) == 1 or sheet.upper() == 'A':
                    site_nom = f"CNDH {city_name}"
                else:
                    site_nom = f"CNDH {city_name} - {sheet}"
                    
                # Create Site
                site_db = conn.execute(text("SELECT id FROM sites WHERE nom = :nom AND checklist_type LIKE 'CNDH%'"), {'nom': site_nom}).fetchone()
                if site_db:
                    site_id = site_db[0]
                else:
                    conn.execute(text(
                        "INSERT INTO sites (nom, ville, marche_id, checklist_type) "
                        "VALUES (:nom, :ville, :marche_id, :ctype)"
                    ), {'nom': site_nom, 'ville': city_name, 'marche_id': marche_id, 'ctype': default_checklist})
                    conn.commit()
                    site_id = conn.execute(text("SELECT LAST_INSERT_ID()")).fetchone()[0]
                    
                # Create Mission
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
                    ), {'titre': f"MP {site_nom}", 'site_id': site_id, 'tech': tech_id})
                    conn.commit()
                    mission_id = conn.execute(text("SELECT LAST_INSERT_ID()")).fetchone()[0]
                    
                processed_sites += 1
                
                # Check equipments
                count_eq = conn.execute(text("SELECT COUNT(*) FROM equipements WHERE site_id = :site_id"), {'site_id': site_id}).fetchone()[0]
                if count_eq > 0:
                    continue
                    
                # Insert equipments
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
                    
                    type_eq = 'AUTRE'
                    art_low = str(article).lower()
                    if 'pc' in art_low or 'uc' in art_low or 'ecran' in art_low or 'ordinateur' in art_low:
                        type_eq = 'PC'
                    elif 'imprimante' in art_low or 'scanner' in art_low:
                        type_eq = 'IMPRIMANTE'
                    elif 'serveur' in art_low or 'switch' in art_low:
                        type_eq = 'RESEAU'
                        
                    eqs_to_insert.append({
                        'site_id': site_id,
                        'direction': entite,
                        'bureau': emplacement,
                        'utilisateur_nom': affectation,
                        'famille': article,
                        'marque': marque,
                        'modele': modele,
                        'numero_serie': serie,
                        'type_equipement': type_eq
                    })
                    
                if eqs_to_insert:
                    for eq in eqs_to_insert:
                        conn.execute(text(
                            "INSERT INTO equipements (site_id, direction, bureau, utilisateur_nom, famille, marque, modele, numero_serie, type_equipement, is_active) "
                            "VALUES (:site_id, :direction, :bureau, :utilisateur_nom, :famille, :marque, :modele, :numero_serie, :type_equipement, 1)"
                        ), eq)
                    conn.commit()
                    total_equipments += len(eqs_to_insert)
                    
        except Exception as e:
            print(f"Error processing {filename}: {e}")

    print(f"Done. Processed {processed_sites} sheets/sites. Inserted {total_equipments} new equipments.")
