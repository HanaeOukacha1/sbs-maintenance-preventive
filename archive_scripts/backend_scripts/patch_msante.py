import sys
with open(r'C:\Users\hanae\Desktop\Stage PFA 2026\backend\app\services\export_msante_capm_dprf.py', 'r', encoding='utf-8') as f:
    new_exports = f.read()

with open(r'C:\Users\hanae\Desktop\Stage PFA 2026\backend\app\services\export_service.py', 'r', encoding='utf-8') as f:
    orig = f.read()

import re
match_capm = re.search(r'(def export_msante_capm.*?return buffer.*?Rapport_MSANTE_CAPM.*?xlsx")', new_exports, re.DOTALL)
match_dprf = re.search(r'(def export_msante_dprf.*?return buffer.*?Rapport_MSANTE_DPRF.*?xlsx")', new_exports, re.DOTALL)

if match_capm and match_dprf and "def export_msante_capm" not in orig:
    capm_func = match_capm.group(1)
    dprf_func = match_dprf.group(1)
    
    orig = orig.replace('def exporter_mission', capm_func + '\n\n' + dprf_func + '\n\ndef exporter_mission')
    
    orig = orig.replace(
        "elif t == 'ANP':\n        return export_anp(mission, interventions, equipements)\n    else:",
        "elif t == 'ANP':\n        return export_anp(mission, interventions, equipements)\n    elif t == 'MSANTE_CAPM':\n        return export_msante_capm(mission, interventions, equipements)\n    elif t == 'MSANTE_DPRF':\n        return export_msante_dprf(mission, interventions, equipements)\n    else:"
    )
    
    # We use mission.site.checklist_type to know if it's CAPM or DPRF, wait.
    # In my logic, I should do:
    detect_msante = """        elif "ANP" in mission.site.marche.nom.upper():
            t = "ANP"
        elif "MSANTE" in mission.site.marche.nom.upper():
            if mission.site.checklist_type == 'MSANTE_CAPM':
                t = 'MSANTE_CAPM'
            elif mission.site.checklist_type == 'MSANTE_DPRF':
                t = 'MSANTE_DPRF'"""
    
    orig = orig.replace(
        'elif "ANP" in mission.site.marche.nom.upper():\n            t = "ANP"',
        detect_msante
    )
    
    # Also add import base64 if missing
    if 'import base64' not in orig:
        orig = orig.replace('import openpyxl', 'import openpyxl\nimport base64')
    if 'from openpyxl.drawing.image import Image' not in orig:
        orig = orig.replace('import openpyxl', 'import openpyxl\nfrom openpyxl.drawing.image import Image')
        
    with open(r'C:\Users\hanae\Desktop\Stage PFA 2026\backend\app\services\export_service.py', 'w', encoding='utf-8') as f:
        f.write(orig)
    print("Patched successfully")
