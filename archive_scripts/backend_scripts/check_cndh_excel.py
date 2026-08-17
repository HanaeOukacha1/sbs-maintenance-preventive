# coding: utf-8
import pandas as pd
import os

folder = r'C:\Users\hanae\Desktop\Stage PFA 2026\MASTER DATA\CNDH'
files_to_check = ['Siège S2 OK.XLS', 'CASABLANCA S2 OK.XLS']

for filename in files_to_check:
    filepath = os.path.join(folder, filename)
    print(f"\n=== File: {filename} ===")
    try:
        xl = pd.ExcelFile(filepath)
        print("Sheets:", xl.sheet_names)
        
        for sheet in xl.sheet_names:
            print(f"\n--- Sheet: {sheet} ---")
            df = xl.parse(sheet)
            # Find the header row (we look for 'DESIGNATION' or 'MARQUE' or 'MATERIEL')
            header_idx = None
            for i, row in df.head(10).iterrows():
                vals = [str(x).lower() for x in row.values]
                if any('marque' in v or 'mat' in v or 'desig' in v for v in vals):
                    header_idx = i
                    break
            
            if header_idx is not None:
                # Get the columns from the header row and a few data rows
                headers = [str(x)[:15] for x in df.iloc[header_idx].values]
                print("Headers:", " | ".join(headers))
                for _, row in df.iloc[header_idx+1:header_idx+4].iterrows():
                    print("  Row:", " | ".join([str(x)[:15] for x in row.values]))
            else:
                print("Could not detect header row.")
    except Exception as e:
        print("Error reading file:", e)