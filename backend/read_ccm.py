import pandas as pd
import sys

sys.stdout.reconfigure(encoding='utf-8')

try:
    df = pd.read_excel(r'C:\Users\hanae\Desktop\Stage PFA 2026\MASTER DATA\MSANTE\CCM S2.xlsx', sheet_name=0, header=None)
    for index, row in df.head(15).iterrows():
        print(f"Row {index}: {[str(x) for x in row.values]}")
except Exception as e:
    print(e)
