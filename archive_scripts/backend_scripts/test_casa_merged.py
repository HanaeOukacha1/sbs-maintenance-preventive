import xlrd

book = xlrd.open_workbook(r'C:\Users\hanae\Desktop\Stage PFA 2026\MASTER DATA\CNDH\CASABLANCA S2 OK.XLS', formatting_info=True)
sheet = book.sheet_by_index(0)
print(f"Merged cells: {sheet.merged_cells}")
print("Rows 10-14:")
for r in range(9, 14):
    print([sheet.cell_value(r, c) for c in range(sheet.ncols)])
