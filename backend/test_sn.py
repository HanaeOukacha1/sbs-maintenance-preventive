import pandas as pd
import math

def is_nan(val):
    if pd.isna(val): return True
    if isinstance(val, float) and math.isnan(val): return True
    if str(val).strip() == "" or str(val).strip().lower() == "nan": return True
    return False

df = pd.read_excel(r'C:\Users\hanae\Desktop\Stage PFA 2026\MASTER DATA\ONP\MP ONP.xlsx', header=7)
row = df.iloc[0]
sn_val = ''
for col in df.columns:
    if 'SERIE' in str(col).upper():
        sn_val = row[col]
        break

sn = str(sn_val).strip() if not is_nan(sn_val) else ''
print('SN IS:', repr(sn))
