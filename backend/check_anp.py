from sqlalchemy import create_engine, text
engine = create_engine('mysql+pymysql://root:@localhost/sbs_db')
with engine.connect() as conn:
    # Check ANP sites
    sites = conn.execute(text("SELECT id, nom, ville, feuilles, checklist_type FROM sites WHERE checklist_type = 'ANP'")).fetchall()
    print('=== Sites ANP ===')
    for s in sites:
        print(f'  id={s[0]}, nom={s[1]}, ville={s[2]}, feuilles={s[3]}, type={s[4]}')
    
    # Check ANP missions
    missions = conn.execute(text("SELECT m.id, m.titre, s.nom FROM missions m JOIN sites s ON m.site_id = s.id WHERE s.checklist_type = 'ANP'")).fetchall()
    print(chr(10) + '=== Missions ANP ===')
    for m in missions:
        print(f'  id={m[0]}, titre={m[1]}, site={m[2]}')
    
    # Check ANP equipment count per site
    for s in sites:
        count = conn.execute(text(f"SELECT COUNT(*), sous_site FROM equipements WHERE site_id = {s[0]} GROUP BY sous_site")).fetchall()
        print(f'chr(10)Equipements site {s[1]}:')
        for c in count:
            print(f'  sous_site={c[1]}, count={c[0]}')
