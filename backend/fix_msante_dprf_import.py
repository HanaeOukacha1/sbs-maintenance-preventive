# -*- coding: utf-8 -*-
import os
import pandas as pd
from app.db.database import SessionLocal
from app.models.equipement import Equipement
from app.models.site import Site

file_path = r'C:\Users\hanae\Desktop\Stage PFA 2026\MASTER DATA\MSANTE\DPRF S2.XLS'
db = SessionLocal()

site = db.query(Site).filter(Site.checklist_type == 'MSANTE_DPRF').first()
if not site:
    print("Site MSANTE_DPRF not found.")
    exit()

# Clear existing equipments for this site to avoid duplicates
db.query(Equipement).filter(Equipement.site_id == site.id).delete()
db.commit()

xls = pd.ExcelFile(file_path)
feuilles_names = []

for sheet_name in xls.sheet_names:
    df = pd.read_excel(xls, sheet_name=sheet_name, header=None)
    
    # Find header
    header_idx = None
    for i in range(min(15, len(df))):
        row = df.iloc[i]
        vals = [str(x).lower().strip() for x in row.values]
        if 'marque' in vals or any('série' in v or 'serie' in v for v in vals) or any('designation' in v or 'désignation' in v for v in vals):
            header_idx = i
            break
            
    if header_idx is None:
        continue

    # Clean the sheet name to make a nice tab name
    nice_tab_name = sheet_name.replace('NV ', '').replace('SERVICE ', '').replace(',', '').strip()
    feuilles_names.append(nice_tab_name)

    headers = [str(x).lower().strip() for x in df.iloc[header_idx].values]
    col_map = {}
    for idx, h in enumerate(headers):
        if 'désignation' in h or 'designation' in h or 'famille' in h: col_map['famille'] = idx
        elif 'marque' in h: col_map['marque'] = idx
        elif 'mod' in h: col_map['modele'] = idx
        elif 'article' in h: col_map['article'] = idx
        elif 'serie' in h or 'série' in h: col_map['serie'] = idx
        elif 'utilisateur' in h or 'nom' in h: col_map['utilisateur'] = idx

    eqs_to_insert = []
    for _, row in df.iloc[header_idx+1:].iterrows():
        vals = row.values
        def get_val(key):
            if key in col_map and col_map[key] < len(vals):
                v = vals[col_map[key]]
                if pd.isna(v) or str(v).lower() == 'nan': return None
                return str(v)[:100]
            return None

        famille = get_val('famille')
        marque = get_val('marque')
        modele = get_val('modele')
        if not modele: modele = get_val('article')
        serie = get_val('serie')
        utilisateur = get_val('utilisateur')
        
        if not famille and not marque and not serie: continue
        row_str = " ".join([str(v).lower() for v in [famille, marque, modele, serie, utilisateur] if v])
        if "cachet" in row_str or "signature" in row_str or "substancium" in row_str: continue

        type_eq = 'AUTRE'
        art_low = str(famille).lower() if famille else ''
        if 'pc' in art_low or 'uc' in art_low or 'ecran' in art_low or 'ordinateur' in art_low: type_eq = 'PC'
        elif 'imprimante' in art_low or 'scanner' in art_low or 'fax' in art_low: type_eq = 'IMPRIMANTE'
        elif 'serveur' in art_low or 'switch' in art_low: type_eq = 'RESEAU'

        nom_val = f"{marque or ''} {modele or ''}".strip()
        if not nom_val: nom_val = famille or "Equipement Inconnu"
        
        eq = Equipement(
            site_id=site.id,
            type_equipement=type_eq,
            nom=nom_val,
            designation=famille,
            marque=marque,
            modele=modele,
            numero_serie=serie,
            utilisateur_nom=utilisateur,
            sous_site=nice_tab_name
        )
        db.add(eq)
        
db.commit()

# Update the feuilles array for the site
site.feuilles = feuilles_names
db.commit()

print(f"Successfully imported equipments for DPRF with tabs: {feuilles_names}")
