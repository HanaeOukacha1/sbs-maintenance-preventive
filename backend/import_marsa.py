import os
import pandas as pd
from sqlalchemy import create_engine, text

engine = create_engine('mysql+pymysql://root:@localhost/sbs_db')
conn = engine.connect()

file_path = r'C:\Users\hanae\Desktop\Stage PFA 2026\MASTER DATA\MARSA MAROC\MP MM .xlsx'
tech_id = 4 # hanae

print("Deleting all missions for Hanae...")
conn.execute(text("DELETE FROM missions WHERE technicien_id = :uid"), {'uid': tech_id})
conn.commit()

print("Setting up MARSA MAROC...")

# Fetch MARSA MAROC marche_id
marche_id = conn.execute(text("SELECT id FROM marches WHERE nom LIKE '%MARSA%' LIMIT 1")).fetchone()
if not marche_id:
    print("Error: Marche MARSA MAROC not found in DB.")
    exit(1)
marche_id = marche_id[0]

# Delete old MARSA MAROC data if any
site_id_res = conn.execute(text("SELECT id FROM sites WHERE marche_id = :mid"), {'mid': marche_id}).fetchall()
for r in site_id_res:
    sid = r[0]
    conn.execute(text("DELETE FROM interventions WHERE equipement_id IN (SELECT id FROM equipements WHERE site_id = :sid)"), {'sid': sid})
    conn.execute(text("DELETE FROM equipements WHERE site_id = :sid"), {'sid': sid})
    conn.execute(text("DELETE FROM sites WHERE id = :sid"), {'sid': sid})
conn.commit()

# Create Site MARSA MAROC
site_nom = "MARSA MAROC Casablanca"
city_name = "CASABLANCA"
default_checklist = 'MARSA_MAROC'

conn.execute(text(
    "INSERT INTO sites (nom, ville, marche_id, checklist_type) "
    "VALUES (:nom, :ville, :marche_id, :ctype)"
), {'nom': site_nom, 'ville': city_name, 'marche_id': marche_id, 'ctype': default_checklist})
conn.commit()
site_id = conn.execute(text("SELECT LAST_INSERT_ID()")).fetchone()[0]

# Create Mission
conn.execute(text(
    "INSERT INTO missions (titre, site_id, technicien_id, statut, date_planifiee) "
    "VALUES (:titre, :site_id, :tech, 'PLANIFIEE', CURDATE())"
), {'titre': "MP MARSA MAROC", 'site_id': site_id, 'tech': tech_id})
conn.commit()

# Parse Excel
df = pd.read_excel(file_path, header=6) # Row 6 is header (0-indexed)

headers = [str(x).lower().strip() for x in df.columns]
col_map = {}
for idx, h in enumerate(headers):
    if 'famille' in h: col_map['famille'] = idx
    elif 'article' in h: col_map['modele'] = idx # In MM, 'Article' is the model (e.g., 5570, Z2)
    elif 'marque' in h: col_map['marque'] = idx
    elif 'serie' in h or 'série' in h: col_map['serie'] = idx
    elif 'direction' in h: col_map['direction'] = idx
    elif 'bureau' in h: col_map['bureau'] = idx
    elif 'nom et prenom' in h or 'utilisateur' in h: col_map['utilisateur'] = idx
    elif 'processeur' in h: col_map['cpu'] = idx
    elif 'ram' in h: col_map['ram'] = idx
    elif 'disque dur' in h: col_map['disque'] = idx
    elif 'système' in h or 'systeme' in h: col_map['systeme'] = idx

inserted = 0
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
    modele = get_val('modele')
    marque = get_val('marque')
    serie = get_val('serie')
    direction = get_val('direction')
    bureau = get_val('bureau')
    utilisateur = get_val('utilisateur')
    
    cpu = get_val('cpu')
    ram = get_val('ram')
    disque = get_val('disque')
    systeme = get_val('systeme')
    
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
        'type_equipement': type_eq,
        'designation': famille,
        'marque': marque,
        'modele': modele,
        'numero_serie': serie,
        'direction': direction,
        'bureau': bureau,
        'utilisateur_nom': utilisateur,
        'cpu': cpu,
        'ram': ram,
        'disque_dur': disque,
        'systeme_exploitation': systeme
    })

if eqs_to_insert:
    conn.execute(
        text("""
            INSERT INTO equipements 
            (site_id, type_equipement, designation, marque, modele, numero_serie, direction, bureau, utilisateur_nom, cpu, ram, disque_dur, systeme_exploitation)
            VALUES 
            (:site_id, :type_equipement, :designation, :marque, :modele, :numero_serie, :direction, :bureau, :utilisateur_nom, :cpu, :ram, :disque_dur, :systeme_exploitation)
        """),
        eqs_to_insert
    )
    conn.commit()
    inserted += len(eqs_to_insert)

print(f"Done. Imported {inserted} equipments for MARSA MAROC.")
