import openpyxl

def prepare_template():
    filepath = "C:/Users/hanae/Desktop/Stage PFA 2026/backend/app/templates/template_msante.xlsx"
    wb = openpyxl.load_workbook(filepath)
    sheet = wb.active
    
    # We clear rows from 9 down to 100
    for r in range(9, 100):
        for c in range(1, 20):
            sheet.cell(row=r, column=c).value = None
            
    wb.save(filepath)
    print("Template prepared successfully.")

if __name__ == "__main__":
    prepare_template()
