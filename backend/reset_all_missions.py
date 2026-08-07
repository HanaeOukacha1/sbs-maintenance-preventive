"""
Script de réinitialisation complète des missions.
Supprime toutes les missions existantes et en crée de nouvelles
pour CHAQUE site, toutes assignées à hanae@sbs.ma (id=4).
"""
from sqlalchemy import create_engine, text

engine = create_engine('mysql+pymysql://root:@localhost/sbs_db')
conn = engine.connect()

HANAE_ID = 4  # hanae@sbs.ma

# 1. Supprimer toutes les missions (et interventions liées)
print("Suppression de toutes les missions existantes...")
conn.execute(text("DELETE FROM interventions"))
conn.execute(text("DELETE FROM missions"))
conn.commit()

# 2. Récupérer tous les sites
sites = conn.execute(text("SELECT id, nom FROM sites ORDER BY id")).fetchall()
print(f"Trouvé {len(sites)} sites.")

# 3. Créer une mission par site, assignée à Hanae
created = 0
for site_id, site_nom in sites:
    conn.execute(text(
        "INSERT INTO missions (titre, site_id, technicien_id, statut, date_planifiee) "
        "VALUES (:titre, :site_id, :tech, 'PLANIFIEE', CURDATE())"
    ), {
        'titre': f"MP {site_nom}",
        'site_id': site_id,
        'tech': HANAE_ID
    })
    created += 1

conn.commit()
print(f"OK - {created} missions créées et assignées à hanae@sbs.ma")
