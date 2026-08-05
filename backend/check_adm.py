from sqlalchemy import create_engine, text
engine = create_engine('mysql+pymysql://root:@localhost/sbs_db')
with engine.connect() as conn:
    sites = conn.execute(text("SELECT id, nom, checklist_type FROM sites WHERE checklist_type = 'ADM'")).fetchall()
    print('=== Sites ADM ===')
    for s in sites:
        print(s)
        
    for s in sites:
        missions = conn.execute(text(f"SELECT id, titre FROM missions WHERE site_id = {s[0]}")).fetchall()
        print(f'Missions for {s[1]}:', missions)
        
        eqs = conn.execute(text(f"SELECT id, designation, marque, modele, type_equipement, serveur_principal_id, est_serveur_redondant FROM equipements WHERE site_id = {s[0]} LIMIT 10")).fetchall()
        print(f'Equipments for {s[1]}:', eqs)
