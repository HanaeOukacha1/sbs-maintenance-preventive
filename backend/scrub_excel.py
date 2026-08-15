import zipfile
import os
import re

def scrub_xlsx(in_path, out_path):
    with zipfile.ZipFile(in_path, 'r') as zin, zipfile.ZipFile(out_path, 'w') as zout:
        for item in zin.infolist():
            # Skip pivots and charts files
            if 'pivot' in item.filename.lower() or 'chart' in item.filename.lower():
                continue
            
            content = zin.read(item.filename)
            
            if item.filename == '[Content_Types].xml':
                content = content.decode('utf-8')
                content = re.sub(r'<Override PartName="[^"]*(pivot|chart)[^"]*"[^>]*>', '', content, flags=re.IGNORECASE)
                content = re.sub(r'<Default Extension="[^"]*(pivot|chart)[^"]*"[^>]*>', '', content, flags=re.IGNORECASE)
                content = content.encode('utf-8')
                
            elif item.filename.endswith('.rels'):
                content = content.decode('utf-8')
                content = re.sub(r'<Relationship [^>]*Target="[^"]*(pivot|chart)[^"]*"[^>]*>', '', content, flags=re.IGNORECASE)
                content = content.encode('utf-8')
                
            elif item.filename == 'xl/workbook.xml':
                content = content.decode('utf-8')
                content = re.sub(r'<pivotCaches>.*?</pivotCaches>', '', content, flags=re.IGNORECASE)
                content = content.encode('utf-8')
                
            elif item.filename.startswith('xl/worksheets/sheet') and item.filename.endswith('.xml'):
                content = content.decode('utf-8')
                content = re.sub(r'<extLst>.*?</extLst>', '', content, flags=re.IGNORECASE)
                content = re.sub(r'<pivotTables>.*?</pivotTables>', '', content, flags=re.IGNORECASE)
                content = re.sub(r'<drawing [^>]*>', '', content, flags=re.IGNORECASE)
                content = re.sub(r'<dataValidations>.*?</dataValidations>', '', content, flags=re.IGNORECASE)
                content = content.encode('utf-8')
                
            zout.writestr(item, content)

scrub_xlsx(r'app\templates\template_amee_marrakech.bak', r'app\templates\template_amee_marrakech_scrubbed.xlsx')
print('Scrubbed.')
