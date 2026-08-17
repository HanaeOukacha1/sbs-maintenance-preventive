import xlrd

book = xlrd.open_workbook(r'C:\Users\hanae\Desktop\Stage PFA 2026\MASTER DATA\CNDH\BENI MELLAL S2 OK.XLS', formatting_info=True)
sheet = book.sheet_by_index(0)
print(f"Merged cells: {sheet.merged_cells}")
