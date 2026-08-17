# coding: utf-8
import os
import pandas as pd

folder = r'C:\Users\hanae\Desktop\Stage PFA 2026\MASTER DATA\CNDH'

for filename in os.listdir(folder):
    if not filename.upper().endswith('.XLS'):
        continue
    filepath = os.path.join(folder, filename)
    print(f"\n=== {filename} ===")
    
    xl = pd.ExcelFile(filepath)
    for sheet in xl.sheet_names:
        df = xl.parse(sheet)
        header_idx = None
        for i, row in df.head(10).iterrows():
            vals = [str(x).lower() for x in row.values]
            if any('marque' in v or 'mat' in v or 'desig' in v or 'article' in v for v in vals):
                header_idx = i
                break
        
        if header_idx is not None:
            headers = [str(x).strip() for x in df.iloc[header_idx].values]
            print(f"Sheet: {sheet} | Headers: {headers}")
            # Also print the first row of data to see what might have mixed up
            if header_idx + 1 < len(df):
                data = [str(x).strip() for x in df.iloc[header_idx+1].values]
                print(f"  Data : {data}")
