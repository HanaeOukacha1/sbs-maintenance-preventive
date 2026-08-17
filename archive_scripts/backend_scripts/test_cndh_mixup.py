# coding: utf-8
from sqlalchemy import create_engine, text
engine = create_engine('mysql+pymysql://root:@localhost/sbs_db')
rows = engine.connect().execute(text("SELECT id, famille, utilisateur_nom, marque FROM equipements WHERE site_id IN (SELECT id FROM sites WHERE checklist_type LIKE 'CNDH%') AND (utilisateur_nom IN ('UC', 'PC PORTABLE', 'ECRAN', 'IMPRIMANTE', 'SCANNER') OR famille NOT IN ('UC', 'PC PORTABLE', 'ECRAN', 'IMPRIMANTE', 'SCANNER', 'PC BUREAU', 'PC', 'ONDELEUR', 'SERVEUR', 'SWITCH'))")).fetchall()
print("Mixed up equipments:")
for r in rows[:30]:
    print(r)
