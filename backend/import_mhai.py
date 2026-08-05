import os
import pandas as pd
import json
from sqlalchemy import create_engine, text

engine = create_engine('mysql+pymysql://root:@localhost/sbs_db')
conn = engine.connect()

file_path = r'C:\Users\hanae\Desktop\Stage PFA 2026\MASTER DATA\MHAI\MP HABOUS S2-24.xlsx'
tech_id = 4 # hanae

print("Deleting all missions for Hanae...")
conn.execute(text("DELETE FROM missions WHERE technicien_id = :uid"), {'uid': tech_id})
conn.commit()

print("Setting up MHAI...")

# Fetch MHAI marche_id
marche_id = conn.execute(text("SELECT id FROM marches WHERE nom LIKE '%MHAI%' LIMIT 1")).fetchone()
if not marche_id:
    # try Habous
    marche_id = conn.execute(text("SELECT id FROM marches WHERE nom LIKE '%Habous%' LIMIT 1")).fetchone()
    if not marche_id:
        print("Error: Marche MHAI not found in DB.")
        exit(1)
marche_id = marche_id[0]

# Delete old MHAI data if any
site_id_res = conn.execute(text("SELECT id FROM sites WHERE marche_id = :mid"), {'mid': marche_id}).fetchall()
for r in site_id_res:
    sid = r[0]
    conn.execute(text("DELETE FROM interventions WHERE equipement_id IN (SELECT id FROM equipements WHERE site_id = :sid)"), {'sid': sid})
    conn.execute(text("DELETE FROM equipements WHERE site_id = :sid"), {'sid': sid})
    conn.execute(text("DELETE FROM sites WHERE id = :sid"), {'sid': sid})
conn.commit()

# Create Site MHAI
site_nom = "MHAI Maroc"
city_name = "MULTIPLE"
default_checklist = 'MHAI'

# Parse Excel to get sheet names
xls = pd.ExcelFile(file_path, engine='openpyxl')
valid_sheets = [s for s in xls.sheet_names if 'feuil' not in s.lower()]
# Clean up sheet names for the UI (remove trailing commas etc)
feuilles_list = [s.strip(', ') for s in valid_sheets]
feuilles_json = json.dumps(feuilles_list)

conn.execute(text(
    "INSERT INTO sites (nom, ville, marche_id, checklist_type, feuilles) "
    "VALUES (:nom, :ville, :marche_id, :ctype, :feuilles)"
), {'nom': site_nom, 'ville': city_name, 'marche_id': marche_id, 'ctype': default_checklist, 'feuilles': feuilles_json})
conn.commit()
site_id = conn.execute(text("SELECT LAST_INSERT_ID()")).fetchone()[0]

# Create Mission
conn.execute(text(
    "INSERT INTO missions (titre, site_id, technicien_id, statut, date_planifiee) "
    "VALUES (:titre, :site_id, :tech, 'PLANIFIEE', CURDATE())"
), {'titre': "MP MHAI", 'site_id': site_id, 'tech': tech_id})
conn.commit()

inserted = 0

for orig_sheet, clean_sheet in zip(valid_sheets, feuilles_list):
    df = pd.read_excel(file_path, sheet_name=orig_sheet, header=7) # Row 7 is header (0-indexed)

    headers = [str(x).lower().strip() for x in df.columns]
    col_map = {}
    for idx, h in enumerate(headers):
        if 'matériel' in h or 'materiel' in h or 'article' in h or 'famille' in h: col_map['famille'] = idx
        elif 'marque' in h: col_map['marque'] = idx
        elif 'modèle' in h or 'modele' in h: col_map['modele'] = idx
        elif 'serie' in h or 'série' in h: col_map['serie'] = idx
        elif 'inventaire' in h: col_map['inventaire'] = idx

    eqs_to_insert = []
    for _, row in df.iterrows():
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
        serie = get_val('serie')
        inventaire = get_val('inventaire')
        
        if not famille and not marque and not serie:
            continue

        type_eq = 'AUTRE'
        art_low = str(famille).lower() if famille else ''
        if 'pc' in art_low or 'uc' in art_low or 'ecran' in art_low or 'ordinateur' in art_low:
            type_eq = 'PC'
        elif 'imprimante' in art_low or 'scanner' in art_low:
            type_eq = 'IMPRIMANTE'
        elif 'serveur' in art_low or 'switch' in art_low:
            type_eq = 'RESEAU'
            
        eqs_to_insert.append({
            'site_id': site_id,
            'sous_site': clean_sheet,
            'type_equipement': type_eq,
            'designation': famille,
            'marque': marque,
            'modele': modele,
            'numero_serie': serie,
            'numero_inventaire': inventaire
        })

    if eqs_to_insert:
        conn.execute(
            text("""
                INSERT INTO equipements 
                (site_id, sous_site, type_equipement, designation, marque, modele, numero_serie, numero_inventaire)
                VALUES 
                (:site_id, :sous_site, :type_equipement, :designation, :marque, :modele, :numero_serie, :numero_inventaire)
            """),
            eqs_to_insert
        )
        conn.commit()
        inserted += len(eqs_to_insert)

print(f"Done. Imported {inserted} equipments for MHAI.")
