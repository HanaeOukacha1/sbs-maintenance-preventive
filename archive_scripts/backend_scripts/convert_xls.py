import os
import win32com.client

master_dir = r'C:\Users\hanae\Desktop\Stage PFA 2026\MASTER DATA\MSANTE'
template_dir = r'C:\Users\hanae\Desktop\Stage PFA 2026\backend\app\templates'

files_to_convert = ['CAPM S2.XLS', 'DPRF S2.XLS']
excel = win32com.client.Dispatch("Excel.Application")
excel.Visible = False

for file in files_to_convert:
    in_path = os.path.join(master_dir, file)
    out_name = f"template_msante_{file.split(' ')[0].lower()}.xlsx"
    out_path = os.path.join(template_dir, out_name)
    
    print(f"Converting {in_path} to {out_path}...")
    wb = excel.Workbooks.Open(in_path)
    
    # Clean up data after header
    if file.startswith('CAPM'):
        sheet = wb.Worksheets(1)
        # Clear rows from 10 to 500
        sheet.Rows("10:500").ClearContents()
    else:
        for ws in wb.Worksheets:
            ws.Rows("10:500").ClearContents()
            
    # Format 51 is xlsx
    if os.path.exists(out_path):
        os.remove(out_path)
    wb.SaveAs(out_path, FileFormat=51)
    wb.Close(SaveChanges=False)

excel.Quit()
print("Conversion done.")
