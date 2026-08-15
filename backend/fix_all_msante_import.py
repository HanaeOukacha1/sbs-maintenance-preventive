# -*- coding: utf-8 -*-
import os
import pandas as pd
from sqlalchemy import text
from app.db.database import SessionLocal
from app.models.equipement import Equipement
from app.models.site import Site

def main():
    db = SessionLocal()
    folder_path = r'C:\Users\hanae\Desktop\Stage PFA 2026\MASTER DATA\MSANTE'
    
    # Check if MSANTE marche exists
    marche_id_res = db.execute(text("SELECT id FROM marches WHERE nom LIKE '%SANTE%' LIMIT 1")).fetchone()
    if not marche_id_res:
        print("Error: Marche MSANTE not found in DB.")
        return
    marche_id = marche_id_res[0]

    # Find MSANTE sites
    msante_sites = db.query(Site).filter(Site.marche_id == marche_id).all()
    site_map = {} # nom -> Site
    for s in msante_sites:
        site_map[s.nom.strip()] = s

    inserted_total = 0
    files = [f for f in os.listdir(folder_path) if f.lower().endswith(('.xls', '.xlsx'))]
    
    for filename in files:
        file_path = os.path.join(folder_path, filename)
        base_name = os.path.splitext(filename)[0].strip()
        clean_name = base_name.replace(" S2", "").replace(" PS", "").strip()
        site_nom = f"MSANTE {clean_name}"
        
        # Check if site exists
        site = site_map.get(site_nom)
        if not site:
            print(f"Skipping {filename}: site {site_nom} not found in DB (Maybe hasn't been created yet).")
            continue
            
        print(f"Processing {filename} for Site: {site_nom} (ID: {site.id})")
        
        # 1. Clear old interventions and equipments
        db.execute(text("DELETE FROM interventions WHERE equipement_id IN (SELECT id FROM equipements WHERE site_id = :sid)"), {'sid': site.id})
        db.query(Equipement).filter(Equipement.site_id == site.id).delete()
        db.commit()

        # 2. Parse all sheets
        try:
            xls = pd.ExcelFile(file_path)
        except Exception as e:
            print(f"Error reading {file_path}: {e}")
            continue

        valid_feuilles = []
        eqs_to_insert = []
        
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

            nice_tab_name = sheet_name.replace('NV ', '').replace('SERVICE ', '').replace(',', '').strip()
            
            headers = [str(x).lower().strip() for x in df.iloc[header_idx].values]
            col_map = {}
            for idx, h in enumerate(headers):
                if 'désignation' in h or 'designation' in h or 'famille' in h: col_map['famille'] = idx
                elif 'marque' in h: col_map['marque'] = idx
                elif 'mod' in h: col_map['modele'] = idx
                elif 'article' in h: col_map['article'] = idx
                elif 'serie' in h or 'série' in h: col_map['serie'] = idx
                elif 'utilisateur' in h or 'nom' in h: col_map['utilisateur'] = idx

            sheet_eqs = []
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
                sheet_eqs.append(eq)
                
            if len(sheet_eqs) > 0:
                valid_feuilles.append(nice_tab_name)
                eqs_to_insert.extend(sheet_eqs)

        if len(valid_feuilles) > 1:
            site.feuilles = valid_feuilles
        else:
            site.feuilles = None
            # Set sous_site to None for all equipments if there are no tabs
            for eq in eqs_to_insert:
                eq.sous_site = None
                
        if eqs_to_insert:
            db.add_all(eqs_to_insert)
            db.commit()
            inserted_total += len(eqs_to_insert)
            if site.feuilles:
                print(f"   -> Imported {len(eqs_to_insert)} equipments with {len(valid_feuilles)} tabs: {valid_feuilles}")
            else:
                print(f"   -> Imported {len(eqs_to_insert)} equipments (No tabs)")
        else:
            print(f"   -> No equipments found.")

    print(f"\nDone. Successfully imported {inserted_total} equipments across all MSANTE sites.")

if __name__ == "__main__":
    main()
