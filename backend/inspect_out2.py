import openpyxl
import sys

sys.stdout.reconfigure(encoding='utf-8')

wb = openpyxl.load_workbook('test_msante_out2.xlsx')
sheet = wb.active
for r in range(8, 15):
    cols = []
    for c in range(1, 10):
        val = sheet.cell(row=r, column=c).value
        if val is not None:
            cols.append(f"{c}:{val}")
    if cols:
        print(f"Row {r}:", cols)
