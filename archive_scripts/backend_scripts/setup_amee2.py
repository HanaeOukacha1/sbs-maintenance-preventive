# coding: utf-8
from sqlalchemy import create_engine, text
import json

engine = create_engine('mysql+pymysql://root:@localhost/sbs_db')
with engine.connect() as conn:
    # Check existing AMEE equipment
    eqs_marr = conn.execute(text("SELECT id, sous_site, type_equipement, designation, marque, modele, numero_serie, utilisateur_nom, cpu, ram, systeme_exploitation, numero_inventaire FROM equipements WHERE site_id = 93 LIMIT 10")).fetchall()
    print('AMEE Marrakech EQ:')
    for e in eqs_marr:
        print(' ', e)
        
    eqs_rabat = conn.execute(text("SELECT id, sous_site, type_equipement, designation, marque, modele, numero_serie, utilisateur_nom, cpu, ram, systeme_exploitation, numero_inventaire FROM equipements WHERE site_id = 94 LIMIT 10")).fetchall()
    print('AMEE Rabat EQ:')
    for e in eqs_rabat:
        print(' ', e)
        
    # Check missions
    missions = conn.execute(text("SELECT id, titre, site_id, technicien_id, statut FROM missions WHERE site_id IN (93, 94)")).fetchall()
    print('AMEE missions:', missions)
    
    # Check user
    user = conn.execute(text("SELECT id, email FROM users WHERE email = 'hanae@sbs.ma'")).fetchone()
    print('User:', user)
