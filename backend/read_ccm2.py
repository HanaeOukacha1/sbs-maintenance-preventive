import openpyxl
import sys

sys.stdout.reconfigure(encoding='utf-8')

try:
    wb = openpyxl.load_workbook(r'C:\Users\hanae\Desktop\Stage PFA 2026\MASTER DATA\MSANTE\CCM S2.xlsx')
    sheet = wb.active
    for r in range(1, 15):
        cols = []
        for c in range(1, 20):
            val = sheet.cell(row=r, column=c).value
            if val is not None:
                cols.append(f"{c}:{val}")
        print(f"Row {r}:", cols)
except Exception as e:
    print(e)
