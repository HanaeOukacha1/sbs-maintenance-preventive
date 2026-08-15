"""
Script qui crée les templates "prêts à remplir" depuis les fichiers Master Data originaux.
Pour Word : ajoute les variables docxtpl {{ }} aux bonnes positions.
Pour Excel : copie les fichiers tels quels (ils SONT les templates).
"""
import sys, os, shutil, re
sys.stdout.reconfigure(encoding='utf-8')

MASTER_DATA = r"c:\Users\hanae\Desktop\Stage PFA 2026\MASTER DATA"
TEMPLATES_DIR = r"c:\Users\hanae\Desktop\Stage PFA 2026\backend\app\templates"

# ============================================================
# EXCEL : copier directement les fichiers Master Data comme templates
# ============================================================
EXCEL_TEMPLATES = {
    "template_anp.xlsx":        os.path.join(MASTER_DATA, "ANP", "MP ANP.xlsx"),
    "template_amee_marrakech.xlsx": os.path.join(MASTER_DATA, "AMEE", "MP AMEE MARRAKECH 1T-2026.xlsx"),
    "template_amee_rabat.xlsx": os.path.join(MASTER_DATA, "AMEE", "NV MP AMEE RABAT 1T-2026.xlsx"),
    "template_onp.xlsx":        os.path.join(MASTER_DATA, "ONP", "MP ONP.xlsx"),
    "template_mhai.xlsx":       os.path.join(MASTER_DATA, "MHAI", "MP HABOUS S2-24.xlsx"),
}

print("=== Copie des templates Excel ===")
for dest_name, src_path in EXCEL_TEMPLATES.items():
    dest_path = os.path.join(TEMPLATES_DIR, dest_name)
    if os.path.exists(src_path):
        shutil.copy2(src_path, dest_path)
        size = os.path.getsize(dest_path)
        print(f"  ✅ {dest_name} ({size//1024} KB)")
    else:
        print(f"  ❌ Source introuvable: {src_path}")

# ============================================================
# WORD : copier les fichiers ADM et MHAI comme templates docxtpl
# (on ajoutera les placeholders dans export_service.py par substitution de texte)
# ============================================================
WORD_TEMPLATES = {
    "template_adm.docx":        os.path.join(MASTER_DATA, "ADM", "MP ADM.docx"),
    "template_ancfcc.docx":     os.path.join(MASTER_DATA, "ANCFCC", "Checklist ANCFCC 132 AGADIR.docx"),
    "template_mhai_pc.docx":    os.path.join(MASTER_DATA, "MHAI", "Fiche préventive 27_11_2023 PC Bureau.docx"),
    "template_mhai_imprimante.docx": os.path.join(MASTER_DATA, "MHAI", "Fiche préventive 27_11_2023 Imprimante + scanner.docx"),
    "template_mhai_serveur.docx": os.path.join(MASTER_DATA, "MHAI", "Fiche préventive 27_11_2023 Serveur.docx"),
}

print("\n=== Copie des templates Word ===")
for dest_name, src_path in WORD_TEMPLATES.items():
    dest_path = os.path.join(TEMPLATES_DIR, dest_name)
    if os.path.exists(src_path):
        shutil.copy2(src_path, dest_path)
        size = os.path.getsize(dest_path)
        print(f"  ✅ {dest_name} ({size//1024} KB)")
    else:
        print(f"  ❌ Source introuvable: {src_path}")

print("\nDone! Templates copiés dans", TEMPLATES_DIR)
