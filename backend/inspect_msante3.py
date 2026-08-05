import openpyxl
wb = openpyxl.load_workbook('app/templates/template_msante.xlsx')
sheet = wb.active
for r in range(6, 10):
    cols = []
    for c in range(1, 15):
        val = sheet.cell(row=r, column=c).value
        if val:
            cols.append(f"{c}:{val}")
    if cols:
        print(f"Ligne {r}:", cols)
