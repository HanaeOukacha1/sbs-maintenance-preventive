import pandas as pd
xls = pd.ExcelFile(r'C:\Users\hanae\Desktop\Stage PFA 2026\MASTER DATA\MSANTE\BUREAU ORDRE S2.XLS')
for sheet in xls.sheet_names:
    df = pd.read_excel(xls, sheet_name=sheet, header=None)
    for idx, row in df.iterrows():
        if idx >= 8:
            print(idx, row.values.tolist())
