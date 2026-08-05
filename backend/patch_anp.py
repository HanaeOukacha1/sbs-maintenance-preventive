import sys
with open(r'C:\Users\hanae\Desktop\Stage PFA 2026\backend\app\services\export_anp_logic.py', 'r', encoding='utf-8') as f:
    anp_code = f.read()

with open(r'C:\Users\hanae\Desktop\Stage PFA 2026\backend\app\services\export_service.py', 'r', encoding='utf-8') as f:
    orig = f.read()

import re
match = re.search(r'(def export_anp.*?return buffer.*?\n)', anp_code, re.DOTALL)
if match and "def export_anp" not in orig:
    anp_func = match.group(1)
    orig = orig.replace('def exporter_mission', anp_func + '\ndef exporter_mission')
    
    orig = orig.replace(
        "if t == 'ANCFCC':\n        return export_ancfcc(mission, interventions, equipements)\n    else:",
        "if t == 'ANCFCC':\n        return export_ancfcc(mission, interventions, equipements)\n    elif t == 'ANP':\n        return export_anp(mission, interventions, equipements)\n    else:"
    )
    
    orig = orig.replace(
        'if "ANCFCC" in mission.site.marche.nom.upper():\n            t = "ANCFCC"',
        'if "ANCFCC" in mission.site.marche.nom.upper():\n            t = "ANCFCC"\n        elif "ANP" in mission.site.marche.nom.upper():\n            t = "ANP"'
    )
    
    with open(r'C:\Users\hanae\Desktop\Stage PFA 2026\backend\app\services\export_service.py', 'w', encoding='utf-8') as f:
        f.write(orig)
    print("Patched successfully")
