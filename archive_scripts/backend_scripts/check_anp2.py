from sqlalchemy import create_engine, text
engine = create_engine('mysql+pymysql://root:@localhost/sbs_db')
with engine.connect() as conn:
    # Sample equipments ANP El Jadida
    eqs = conn.execute(text("SELECT id, nom, designation, marque, modele, numero_serie, type_equipement, sous_site FROM equipements WHERE site_id = 108 LIMIT 5")).fetchall()
    print('=== Equipements ANP El Jadida (5 premiers) ===')
    for e in eqs:
        print(f'  id={e[0]}, nom={e[1]}, desig={e[2]}, marque={e[3]}, modele={e[4]}, sn={e[5]}, type={e[6]}, ss={e[7]}')
    
    eqs2 = conn.execute(text("SELECT id, nom, designation, marque, modele, numero_serie, type_equipement, sous_site FROM equipements WHERE site_id = 109 LIMIT 5")).fetchall()
    print(chr(10) + '=== Equipements ANP Jorf Lasfar (5 premiers) ===')
    for e in eqs2:
        print(f'  id={e[0]}, nom={e[1]}, desig={e[2]}, marque={e[3]}, modele={e[4]}, sn={e[5]}, type={e[6]}, ss={e[7]}')
