import os
import sys
import pandas as pd
path = r'C:\Users\hanae\Desktop\Stage PFA 2026\MASTER DATA\MSANTE\DPRF S2.XLS'
xls = pd.ExcelFile(path)
print("Sheets in DPRF:", xls.sheet_names)
