# coding: utf-8
from sqlalchemy import create_engine, text

engine = create_engine('mysql+pymysql://root:@localhost/sbs_db', pool_pre_ping=True)
with engine.connect() as conn:
    for checklist in ['AMEE_MARRAKECH', 'AMEE_RABAT']:
        site = conn.execute(text(f"SELECT id, nom, feuilles FROM sites WHERE checklist_type = '{checklist}'")).fetchone()
        if not site:
            print(f"Site {checklist} not found")
            continue
        site_id, nom, feuilles = site
        print(f"\n=== {nom} (ID={site_id}) ===")
        print(f"Feuilles JSON: {feuilles}")
        
        # Check sous_site distribution for equipements
        rows = conn.execute(text(f"SELECT sous_site, COUNT(*) as cnt FROM equipements WHERE site_id = {site_id} GROUP BY sous_site")).fetchall()
        for r in rows:
            print(f"  sous_site='{r[0]}' => {r[1]} équipements")
