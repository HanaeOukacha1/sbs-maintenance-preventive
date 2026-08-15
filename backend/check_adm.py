import sys
sys.path.append('.')
from app.db.database import SessionLocal
from sqlalchemy import text

db = SessionLocal()
# Voir les equipements ADM en base
rows = db.execute(text(
    "SELECT e.id, e.nom, e.marque, e.modele, e.cpu, e.ram, e.disque_dur, e.disque_c, e.disque_d, e.ip "
    "FROM equipements e "
    "JOIN sites s ON e.site_id = s.id "
    "JOIN marches m ON s.marche_id = m.id "
    "WHERE m.nom LIKE '%ADM%' LIMIT 10"
)).fetchall()
print(f"Found {len(rows)} ADM equipements:")
for r in rows:
    print(f"  ID:{r[0]} | nom:{r[1]} | marque:{r[2]} | modele:{r[3]} | cpu:{r[4]} | ram:{r[5]} | disque_dur:{r[6]} | disque_c:{r[7]} | disque_d:{r[8]} | ip:{r[9]}")
db.close()
