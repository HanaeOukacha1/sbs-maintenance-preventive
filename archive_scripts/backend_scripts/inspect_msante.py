import os
import sys
sys.stdout.reconfigure(encoding='utf-8')

msante_dir = r'C:\Users\hanae\Desktop\Stage PFA 2026\MASTER DATA\MSANTE'
files = ['CAPM S2.XLS', 'DPRF S2.XLS']
for f in files:
    try:
        path = os.path.join(msante_dir, f)
        import pandas as pd
        df = pd.read_excel(path, header=None)
        print(f"--- {f} ---")
        for i, r in df.head(15).iterrows():
            print([str(x) for x in r.values if pd.notna(x)])
    except Exception as e:
        print(e)
