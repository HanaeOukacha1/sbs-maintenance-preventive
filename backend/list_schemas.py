import json, sys, os
sys.path.append(r'C:\Users\hanae\Desktop\Stage PFA 2026\backend')
from app.db.database import SessionLocal
from sqlalchemy import text

db = SessionLocal()
rows = db.execute(text('SELECT id, nom, schema_data FROM json_schemas ORDER BY id')).fetchall()
for row in rows:
    data = row[2]
    if isinstance(data, str):
        try:
            data = json.loads(data)
        except:
            data = []
    if data:
        print("ID=%d, Nom=%s:" % (row[0], row[1]))
        for f in data:
            if isinstance(f, dict):
                print("  key=%s, label=%s" % (f.get("key"), f.get("label")))
db.close()
