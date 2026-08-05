# coding: utf-8
from sqlalchemy import create_engine, text
engine = create_engine('mysql+pymysql://root:@localhost/sbs_db', pool_pre_ping=True)
with engine.connect() as conn:
    # Check AMEE sites
    print("=== AMEE sites ===")
    rows = conn.execute(text("SELECT id, nom, feuilles, checklist_type FROM sites WHERE nom LIKE '%AMEE%'")).fetchall()
    for r in rows:
        print(r)
    
    # Check MHAI Tanger
    print("\n=== MHAI TANGER site ===")
    rows = conn.execute(text("SELECT id, nom, feuilles, checklist_type FROM sites WHERE nom LIKE '%TANGER%'")).fetchall()
    for r in rows:
        print(r)
    
    # Check how sous_site is populated for MHAI Tanger
    print("\n=== MHAI Tanger equipements distinct sous_site ===")
    site_id = conn.execute(text("SELECT id FROM sites WHERE nom LIKE '%TANGER%' AND checklist_type='MHAI' LIMIT 1")).fetchone()
    if site_id:
        rows = conn.execute(text(f"SELECT DISTINCT sous_site, COUNT(*) FROM equipements WHERE site_id = {site_id[0]} GROUP BY sous_site")).fetchall()
        for r in rows:
            print(r)
