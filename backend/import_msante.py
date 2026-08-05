import os
import pandas as pd
from sqlalchemy import create_engine, text

engine = create_engine('mysql+pymysql://root:@localhost/sbs_db')
conn = engine.connect()

folder_path = r'C:\Users\hanae\Desktop\Stage PFA 2026\MASTER DATA\MSANTE'
tech_id = 4 # hanae

print("Deleting all missions for Hanae...")
conn.execute(text("DELETE FROM missions WHERE technicien_id = :uid"), {'uid': tech_id})
conn.commit()

print("Setting up MSANTE...")

# Fetch MSANTE marche_id
marche_id = conn.execute(text("SELECT id FROM marches WHERE nom LIKE '%SANTE%' LIMIT 1")).fetchone()
if not marche_id:
    print("Error: Marche MSANTE not found in DB.")
    exit(1)
marche_id = marche_id[0]

# Delete old MSANTE data if any
site_id_res = conn.execute(text("SELECT id FROM sites WHERE marche_id = :mid"), {'mid': marche_id}).fetchall()
for r in site_id_res:
    sid = r[0]
    conn.execute(text("DELETE FROM interventions WHERE equipement_id IN (SELECT id FROM equipements WHERE site_id = :sid)"), {'sid': sid})
    conn.execute(text("DELETE FROM equipements WHERE site_id = :sid"), {'sid': sid})
    conn.execute(text("DELETE FROM missions WHERE site_id = :sid"), {'sid': sid})
    conn.execute(text("DELETE FROM sites WHERE id = :sid"), {'sid': sid})
conn.commit()

city_name = "RABAT"

inserted_total = 0

for filename in os.listdir(folder_path):
    if not (filename.lower().endswith('.xls') or filename.lower().endswith('.xlsx')):
        continue
        
    file_path = os.path.join(folder_path, filename)
    base_name = os.path.splitext(filename)[0].strip()
    
    # Remove " S2" or " PS" from base_name to make it cleaner
    clean_name = base_name.replace(" S2", "").replace(" PS", "").strip()
    
    site_nom = f"MSANTE {clean_name}"
    
    # Parse Excel
    # Since headers might be on row 7, 8, 9, we scan first few rows to find it
    df = pd.read_excel(file_path, header=None)
    
    header_idx = None
    for i in range(min(15, len(df))):
        row = df.iloc[i]
        vals = [str(x).lower().strip() for x in row.values]
        if 'marque' in vals or any('série' in v or 'serie' in v for v in vals) or any('designation' in v or 'désignation' in v for v in vals):
            header_idx = i
            break
            
    if header_idx is None:
        print(f"Header not found in {filename}, skipping.")
        continue
        
    headers = [str(x).lower().strip() for x in df.iloc[header_idx].values]
    
    ctype = 'MSANTE_STANDARD'
    if 'DPRF' in clean_name.upper():
        ctype = 'MSANTE_DPRF'
    elif 'CAPM' in clean_name.upper() or any('utilisateur' in h for h in headers) or any('signature' in h for h in headers):
        ctype = 'MSANTE_CAPM'
        
    # Create Site
    conn.execute(text(
        "INSERT INTO sites (nom, ville, marche_id, checklist_type) "
        "VALUES (:nom, :ville, :marche_id, :ctype)"
    ), {'nom': site_nom, 'ville': city_name, 'marche_id': marche_id, 'ctype': ctype})
    conn.commit()
    site_id = conn.execute(text("SELECT LAST_INSERT_ID()")).fetchone()[0]

    # Create Mission
    conn.execute(text(
        "INSERT INTO missions (titre, site_id, technicien_id, statut, date_planifiee) "
        "VALUES (:titre, :site_id, :tech, 'PLANIFIEE', CURDATE())"
    ), {'titre': f"MP {site_nom}", 'site_id': site_id, 'tech': tech_id})
    conn.commit()

    col_map = {}
    for idx, h in enumerate(headers):
        if 'désignation' in h or 'designation' in h or 'famille' in h: col_map['famille'] = idx
        elif 'marque' in h: col_map['marque'] = idx
        elif 'mod' in h: col_map['modele'] = idx
        elif 'article' in h: col_map['article'] = idx # CAPM uses Article as model
        elif 'serie' in h or 'série' in h: col_map['serie'] = idx
        elif 'utilisateur' in h or 'nom' in h: col_map['utilisateur'] = idx

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

        famille = get_val('famille')
        marque = get_val('marque')
        modele = get_val('modele')
        if not modele:
            modele = get_val('article')
            
        serie = get_val('serie')
        utilisateur = get_val('utilisateur')
        
        if not famille and not marque and not serie:
            continue
            
        # Ignore footer rows
        row_str = " ".join([str(v).lower() for v in [famille, marque, modele, serie, utilisateur] if v])
        if "cachet" in row_str or "signature" in row_str or "substancium" in row_str:
            continue

        type_eq = 'AUTRE'
        art_low = str(famille).lower() if famille else ''
        if 'pc' in art_low or 'uc' in art_low or 'ecran' in art_low or 'ordinateur' in art_low:
            type_eq = 'PC'
        elif 'imprimante' in art_low or 'scanner' in art_low or 'fax' in art_low:
            type_eq = 'IMPRIMANTE'
        elif 'serveur' in art_low or 'switch' in art_low:
            type_eq = 'RESEAU'
            
        eqs_to_insert.append({
            'site_id': site_id,
            'type_equipement': type_eq,
            'designation': famille,
            'marque': marque,
            'modele': modele,
            'numero_serie': serie,
            'utilisateur_nom': utilisateur
        })

    if eqs_to_insert:
        conn.execute(
            text("""
                INSERT INTO equipements 
                (site_id, type_equipement, designation, marque, modele, numero_serie, utilisateur_nom)
                VALUES 
                (:site_id, :type_equipement, :designation, :marque, :modele, :numero_serie, :utilisateur_nom)
            """),
            eqs_to_insert
        )
        conn.commit()
        inserted_total += len(eqs_to_insert)
        
    print(f"Processed {filename}, imported {len(eqs_to_insert)} equipments.")

print(f"Done. Imported total {inserted_total} equipments for MSANTE across {len(os.listdir(folder_path))} divisions.")
