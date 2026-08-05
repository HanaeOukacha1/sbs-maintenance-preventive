import os
import sys
sys.stdout.reconfigure(encoding='utf-8')
import pandas as pd

msante_dir = r'C:\Users\hanae\Desktop\Stage PFA 2026\MASTER DATA\MSANTE'
files = ['CAPM S2.XLS', 'DPRF S2.XLS']
for f in files:
    try:
        path = os.path.join(msante_dir, f)
        df = pd.read_excel(path, header=None)
        print(f"--- {f} ---")
        for i, r in df.head(15).iterrows():
            print([str(x) if pd.notna(x) else "" for x in r.values[:8]])
    except Exception as e:
        print(e)
