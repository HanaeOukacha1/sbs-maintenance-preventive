# coding: utf-8
from sqlalchemy import create_engine, text
import pandas as pd
engine = create_engine('mysql+pymysql://root:@localhost/sbs_db')
rows = engine.connect().execute(text("SELECT id, famille, marque, modele, utilisateur_nom FROM equipements WHERE site_id = (SELECT id FROM sites WHERE nom = 'CNDH CASABLANCA' LIMIT 1) ORDER BY id LIMIT 10")).fetchall()
print("Casa DB Equipments:")
for r in rows:
    print(r)

print("\nCasa Excel Equipments:")
df = pd.read_excel(r'C:\Users\hanae\Desktop\Stage PFA 2026\MASTER DATA\CNDH\CASABLANCA S2 OK.XLS', header=None)
print(df.iloc[8:20].to_string())
