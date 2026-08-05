# coding: utf-8
from sqlalchemy import create_engine, text
import json

engine = create_engine('mysql+pymysql://root:@localhost/sbs_db', pool_pre_ping=True)
with engine.connect() as conn:
    # Sample Marrakech equipment - what types and sous_sites exist
    sample = conn.execute(text(
        "SELECT sous_site, type_equipement, designation, marque, modele, numero_serie, utilisateur_nom, cpu, antivirus, numero_inventaire "
        "FROM equipements WHERE site_id = 93 LIMIT 30"
    )).fetchall()
    print("=== Marrakech Equipment Sample ===")
    for s in sample:
        print(s)
    
    # Sample Rabat
    sample_r = conn.execute(text(
        "SELECT sous_site, type_equipement, designation, marque, modele, numero_serie "
        "FROM equipements WHERE site_id = 94 LIMIT 20"
    )).fetchall()
    print("\n=== Rabat Equipment Sample ===")
    for s in sample_r:
        print(s)
