# coding: utf-8
from sqlalchemy import create_engine, text

engine = create_engine('mysql+pymysql://root:@localhost/sbs_db', pool_pre_ping=True)
with engine.connect() as conn:
    # Check feuilles for MHAI sites
    print("=== MHAI sites ===")
    rows = conn.execute(text("SELECT id, nom, feuilles FROM sites WHERE checklist_type = 'MHAI'")).fetchall()
    for r in rows:
        print(f"ID={r[0]}, nom={r[1]}, feuilles={r[2]}")
    
    print()
    # Check feuilles for AMEE sites
    print("=== AMEE sites ===")
    rows = conn.execute(text("SELECT id, nom, feuilles FROM sites WHERE checklist_type LIKE 'AMEE%'")).fetchall()
    for r in rows:
        print(f"ID={r[0]}, nom={r[1]}, feuilles={r[2]}")

    # The fix: MHAI sites should NOT have feuilles (they are flat lists per city)
    print("\n--- Fixing MHAI sites: removing feuilles ---")
    mhai_ids = [r[0] for r in conn.execute(text("SELECT id FROM sites WHERE checklist_type = 'MHAI'")).fetchall()]
    for sid in mhai_ids:
        conn.execute(text(f"UPDATE sites SET feuilles = NULL WHERE id = {sid}"))
    conn.commit()
    print(f"Done: cleared feuilles for {len(mhai_ids)} MHAI sites")
