import sys, re
sys.path.append('.')
from app.db.database import SessionLocal
from sqlalchemy import text

db = SessionLocal()

# Récupérer les équipements ADM dont disque_dur contient "C:... D:..."
rows = db.execute(text(
    "SELECT e.id, e.disque_dur FROM equipements e "
    "JOIN sites s ON e.site_id = s.id "
    "JOIN marches m ON s.marche_id = m.id "
    "WHERE m.nom LIKE '%ADM%'"
)).fetchall()

updated = 0
for row in rows:
    eq_id, disque_dur = row[0], row[1] or ''
    # Format attendu : "C:104 752 D:394 387" ou "104 752" (sans D)
    disque_c = None
    disque_d = None

    # Regex pour extraire C et D
    m = re.search(r'C[:\s]*([\d\s]+)\s+D[:\s]*([\d\s]+)', disque_dur, re.IGNORECASE)
    if m:
        disque_c = m.group(1).strip()
        disque_d = m.group(2).strip()
    elif disque_dur.strip():
        # Pas de D trouvé, tout est pour C
        disque_c = disque_dur.strip()

    if disque_c or disque_d:
        db.execute(text(
            "UPDATE equipements SET disque_c = :c, disque_d = :d WHERE id = :id"
        ), {'c': disque_c, 'd': disque_d, 'id': eq_id})
        updated += 1
        print(f"  ID:{eq_id} | disque_dur='{disque_dur}' -> disque_c='{disque_c}' | disque_d='{disque_d}'")

db.commit()
print(f"\n✅ {updated} équipements ADM mis à jour!")
db.close()
