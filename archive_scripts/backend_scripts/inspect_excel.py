import openpyxl

def inspect_excel():
    wb = openpyxl.load_workbook("C:/Users/hanae/Desktop/Stage PFA 2026/backend/app/templates/template_msante.xlsx")
    sheet = wb.active
    print("--- FIRST 10 ROWS ---")
    for r in range(1, 11):
        row_vals = []
        for c in range(1, 20):
            cell = sheet.cell(row=r, column=c)
            row_vals.append(cell.value)
        print(f"Row {r}: {row_vals}")

if __name__ == "__main__":
    inspect_excel()
