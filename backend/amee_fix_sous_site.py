# coding: utf-8
from sqlalchemy import create_engine, text
import json

engine = create_engine('mysql+pymysql://root:@localhost/sbs_db', pool_pre_ping=True)
with engine.connect() as conn:
    # =================================================================
    # AMEE MARRAKECH (site_id=93) : reassign sous_site by type
    # DATA CENTER = SERVEUR
    # UC = PC + ECRAN 
    # IMPRIMANTE ET MFP = IMPRIMANTE, MFP, PHOTOCOPIEUR
    # MISE A JOUR = kept as virtual (all UC equipments)
    # AVANCEE = same UC, but with antivirus/stockage details (Feuil1)
    # We'll use sous_site to categorize: UC, DATA CENTER, IMPRIMANTE ET MFP
    # MISE A JOUR and AVANCEE are the same list but different form fields
    # =================================================================
    
    # Reset all to NULL first
    conn.execute(text("UPDATE equipements SET sous_site = NULL WHERE site_id = 93"))
    conn.commit()
    
    # Serveurs -> DATA CENTER
    conn.execute(text("UPDATE equipements SET sous_site = 'DATA CENTER' WHERE site_id = 93 AND type_equipement = 'SERVEUR'"))
    conn.commit()
    
    # PC + ECRAN -> UC (shared between UC and MISE A JOUR tabs)
    conn.execute(text("UPDATE equipements SET sous_site = 'UC' WHERE site_id = 93 AND type_equipement IN ('PC', 'ECRAN', 'PORTABLE')"))
    conn.commit()
    
    # Imprimantes -> IMPRIMANTE ET MFP
    conn.execute(text("UPDATE equipements SET sous_site = 'IMPRIMANTE ET MFP' WHERE site_id = 93 AND type_equipement IN ('IMPRIMANTE', 'MFP', 'PHOTOCOPIEUR')"))
    conn.commit()
    
    # =================================================================
    # AMEE RABAT (site_id=94) : fix sous_site properly
    # All current are IMP ET MFP RESEAUX. Need to add PC, DATA CENTER, MISE A JOUR.
    # The DB only has imprimantes imported - fix their sous_site first
    # =================================================================
    conn.execute(text("UPDATE equipements SET sous_site = 'IMP ET MFP RESEAUX' WHERE site_id = 94"))
    conn.commit()
    
    # Verification
    marr_ss = conn.execute(text("SELECT sous_site, type_equipement, COUNT(*) cnt FROM equipements WHERE site_id = 93 GROUP BY sous_site, type_equipement ORDER BY sous_site")).fetchall()
    print("Marrakech breakdown:")
    for r in marr_ss:
        print("  ", r)
    
    rabat_ss = conn.execute(text("SELECT sous_site, COUNT(*) cnt FROM equipements WHERE site_id = 94 GROUP BY sous_site")).fetchall()
    print("Rabat breakdown:")
    for r in rabat_ss:
        print("  ", r)
    
    # Fix Marrakech feuilles - 5 feuilles
    marr_feuilles = json.dumps(['DATA CENTER', 'UC', 'MISE A JOUR', 'IMPRIMANTE ET MFP', 'AVANCEE'])
    conn.execute(text("UPDATE sites SET feuilles = :f WHERE id = 93"), {'f': marr_feuilles})
    conn.commit()
    
    # Fix Rabat feuilles - 4 feuilles
    rabat_feuilles = json.dumps(['PC', 'MISE A JOUR', 'IMP ET MFP RESEAUX', 'DATA CENTER'])
    conn.execute(text("UPDATE sites SET feuilles = :f WHERE id = 94"), {'f': rabat_feuilles})
    conn.commit()

print("All done.")
