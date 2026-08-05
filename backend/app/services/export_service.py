import os
from io import BytesIO
from docxtpl import DocxTemplate
import openpyxl
from openpyxl.drawing.image import Image
import base64
from copy import copy
from datetime import date

TEMPLATES_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "templates")

def export_ancfcc(mission, interventions, equipements):
    """
    Génère un fichier Word par équipement pour ANCFCC, ou un fichier global avec sauts de page.
    Pour simplifier le PoC, on retourne le 1er équipement dans le buffer, 
    ou on combine si on a plusieurs (docxtpl gère bien les documents simples).
    """
    # Si on a plusieurs équipements, on pourrait devoir créer un zip avec plusieurs fichiers
    # Pour l'instant, on va générer le rapport du premier équipement
    
    if not interventions:
        raise ValueError("Aucune intervention disponible pour l'export.")
        
    intervention = interventions[0]
    eq = next((e for e in equipements if e.id == intervention.equipement_id), None)
    
    template_path = os.path.join(TEMPLATES_DIR, "template_ancfcc.docx")
    if not os.path.exists(template_path):
        raise FileNotFoundError(f"Template introuvable: {template_path}")
        
    doc = DocxTemplate(template_path)
    
    reponses = intervention.reponses or {}
    
    # Mapping
    context = {
        "date_intervention": intervention.date_intervention.strftime("%d / %m / %Y") if intervention.date_intervention else "",
        "nom_technicien": intervention.signature_technicien or "", # ou mission.technicien.prenom si on a la relation
        "nom_responsable": intervention.signature_client or "",
        "puissance_kva": eq.puissance_kva or "" if eq else "",
        "zone": eq.zone or "" if eq else "",
        "nb_batteries": eq.nb_batteries or "" if eq else "",
        "ville": mission.site.ville or "" if mission.site else "",
        "marque_modele": f"{eq.marque or ''} {eq.modele or ''}".strip() if eq else "",
        "etablissement": (eq.entite or eq.sous_site or mission.site.nom or "") if eq else (mission.site.nom or "" if mission.site else ""),
        "nom_site": mission.site.nom or "" if mission.site else "",
        "numero_serie": eq.numero_serie or "" if eq else "",
        "capacite_batteries": getattr(eq, 'capacite_batteries', '') or "" if eq else "",
    }
    
    # Mapping de la checklist (10 points)
    # Les clés dans 'reponses' sont des entiers sous forme de string: '0', '1', ...
    for i in range(10):
        # La clé peut être '0', '1'... ou 'pt1', 'pt2'... selon la version de l'app mobile
        rep = reponses.get(str(i)) or reponses.get(i) or reponses.get(f"pt{i+1}") or {}
        
        # Si la réponse est un dictionnaire (ancien format prévu)
        if isinstance(rep, dict):
            val_oui = "X" if rep.get("reponse", "").lower() in ["oui", "ok", "fait", "bon"] else ""
            obs = rep.get("observation") or ""
        # Si la réponse est juste une string (nouveau format de l'app mobile)
        else:
            val_oui = "X" if str(rep).lower() in ["oui", "ok", "fait", "bon"] else ""
            obs = ""
            
        context[f"pt{i+1}_oui"] = val_oui
        context[f"pt{i+1}_obs"] = obs

    doc.render(context)
    
    buffer = BytesIO()
    doc.save(buffer)
    buffer.seek(0)
    
    return buffer, "application/vnd.openxmlformats-officedocument.wordprocessingml.document", f"Rapport_ANCFCC_{mission.site.nom if mission.site else ''}.docx"


def export_msante(mission, interventions, equipements):
    """
    Génère un tableau Excel listant tous les équipements et leurs observations.
    """
    template_path = os.path.join(TEMPLATES_DIR, "template_msante.xlsx")
    if not os.path.exists(template_path):
        raise FileNotFoundError(f"Template introuvable: {template_path}")
        
    wb = openpyxl.load_workbook(template_path)
    sheet = wb.active
    
    # Entêtes :
    # Row 6: VILLE (A6) | Période (D6)
    sheet["A6"] = mission.site.ville if mission.site else ""
    # Période = semestre actuel
    today = date.today()
    semestre = 1 if today.month <= 6 else 2
    sheet["D6"] = f"Période : {semestre}ème semestre {today.year}"
    
    # Affectation
    sheet["A7"] = f"Affectation : {mission.site.nom if mission.site else ''}"
    
    # Lignes à partir de la ligne 9
    start_row = 9
    
    # On va mapper chaque intervention à son équipement
    # MSANTE demande: N°, DESIGNATION, MARQUE, MODELE, N° DE SERIE, OBSERVATION, etc.
    # Dans le template MSANTE original, les colonnes sont:
    # 1: N° (A)
    # 2: DESIGNATION (B)
    # 3: MARQUE (C)
    # 4: MODELE (D)
    # 5: N° SERIE (E)
    # ... on peut ajouter l'observation à la fin
    
    # Pour s'assurer de garder le style de la ligne 9 (bordures, police)
    def copy_style(src_cell, dest_cell):
        if src_cell.has_style:
            dest_cell.font = copy(src_cell.font)
            dest_cell.border = copy(src_cell.border)
            dest_cell.fill = copy(src_cell.fill)
            dest_cell.number_format = copy(src_cell.number_format)
            dest_cell.protection = copy(src_cell.protection)
            dest_cell.alignment = copy(src_cell.alignment)

    # Récupérer le style de référence depuis la ligne 8 (en-têtes) ou 9 (si elle existe)
    ref_row = 8
    
    for idx, eq in enumerate(equipements):
        row_idx = start_row + idx
        
        # Trouver l'intervention correspondante (s'il y en a une)
        intervention = next((i for i in interventions if i.equipement_id == eq.id), None)
        
        designation = getattr(eq, 'designation', None) or getattr(eq, 'famille', None) or getattr(eq, 'type_equipement', None) or ""
        marque = getattr(eq, 'marque', None) or ""
        modele = getattr(eq, 'modele', None) or ""
        n_serie = getattr(eq, 'numero_serie', None) or ""
        observation = ""
        
        if intervention:
            reponses = intervention.reponses or {}
            
            # Prioritize modifications made by technician
            eq_mod = reponses.get("equipement_modifie", {})
            designation = eq_mod.get("designation") or designation
            marque = eq_mod.get("marque") or marque
            modele = eq_mod.get("modele") or modele
            n_serie = eq_mod.get("numero_serie") or n_serie

            if intervention.est_hors_inventaire and intervention.equipement_hors_inventaire:
                eq_hi = intervention.equipement_hors_inventaire
                designation = eq_hi.get('designation') or designation
                marque = eq_hi.get('marque') or marque
                modele = eq_hi.get('modele') or modele
                n_serie = eq_hi.get('numero_serie') or n_serie
            
            observation = reponses.get("observation") or reponses.get("notes") or ""
        
        sheet.cell(row=row_idx, column=1, value=idx+1)
        sheet.cell(row=row_idx, column=2, value=designation)
        sheet.cell(row=row_idx, column=3, value=marque)
        sheet.cell(row=row_idx, column=4, value=modele)
        sheet.cell(row=row_idx, column=5, value=n_serie)
        sheet.cell(row=row_idx, column=6, value=observation)
        
        # Appliquer les styles
        for c in range(1, 10):
            copy_style(sheet.cell(row=ref_row, column=c), sheet.cell(row=row_idx, column=c))
            
    buffer = BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    
    return buffer, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", f"Rapport_MSANTE_{mission.site.nom if mission.site else ''}.xlsx"


def export_anp(mission, interventions, equipements):
    template_path = os.path.join(os.path.dirname(__file__), '..', 'templates', 'template_anp.xlsx')
    wb = openpyxl.load_workbook(template_path)
    sheet = wb.active
    
    if mission.site:
        sheet['A5'] = f"Site: {mission.site.nom}"
        
    start_row = 7
    ref_row = 6
    
    for idx, eq in enumerate(equipements):
        row_idx = start_row + idx
        intervention = next((i for i in interventions if i.equipement_id == eq.id), None)
        
        designation = getattr(eq, 'designation', None) or getattr(eq, 'famille', None) or getattr(eq, 'type_equipement', None) or ""
        marque = getattr(eq, 'marque', None) or ""
        modele = getattr(eq, 'modele', None) or ""
        n_serie = getattr(eq, 'numero_serie', None) or ""
        etat = ""
        
        if intervention:
            reponses = intervention.reponses or {}
            eq_mod = reponses.get("equipement_modifie", {})
            designation = eq_mod.get("designation") or designation
            marque = eq_mod.get("marque") or marque
            modele = eq_mod.get("modele") or modele
            n_serie = eq_mod.get("numero_serie") or n_serie

            if intervention.est_hors_inventaire and intervention.equipement_hors_inventaire:
                eq_hi = intervention.equipement_hors_inventaire
                designation = eq_hi.get('designation') or designation
                marque = eq_hi.get('marque') or marque
                modele = eq_hi.get('modele') or modele
                n_serie = eq_hi.get('numero_serie') or n_serie
            
            etat = reponses.get("etat") or ""
        
        sheet.cell(row=row_idx, column=1, value=idx+1)
        sheet.cell(row=row_idx, column=2, value=designation)
        sheet.cell(row=row_idx, column=3, value=marque)
        sheet.cell(row=row_idx, column=4, value=modele)
        sheet.cell(row=row_idx, column=5, value=n_serie)
        sheet.cell(row=row_idx, column=6, value=etat)
        
        for c in range(1, 7):
            copy_style(sheet.cell(row=ref_row, column=c), sheet.cell(row=row_idx, column=c))
            
    buffer = BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    
    return buffer, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", f"Rapport_ANP_{mission.site.nom if mission.site else ''}.xlsx"

def export_msante_capm(mission, interventions, equipements):
    template_path = os.path.join(os.path.dirname(__file__), '..', 'templates', 'template_msante_capm.xlsx')
    wb = openpyxl.load_workbook(template_path)
    sheet = wb.active
    
    start_row = 10
    ref_row = 10
    
    for idx, eq in enumerate(equipements):
        row_idx = start_row + idx
        intervention = next((i for i in interventions if i.equipement_id == eq.id), None)
        
        designation = getattr(eq, 'designation', None) or getattr(eq, 'famille', None) or getattr(eq, 'type_equipement', None) or ""
        marque = getattr(eq, 'marque', None) or ""
        modele = getattr(eq, 'modele', None) or ""
        n_serie = getattr(eq, 'numero_serie', None) or ""
        utilisateur = getattr(eq, 'utilisateur_nom', None) or ""
        signature_base64 = None
        
        if intervention:
            reponses = intervention.reponses or {}
            eq_mod = reponses.get("equipement_modifie", {})
            designation = eq_mod.get("designation") or designation
            marque = eq_mod.get("marque") or marque
            modele = eq_mod.get("modele") or modele
            n_serie = eq_mod.get("numero_serie") or n_serie
            utilisateur = eq_mod.get("utilisateur") or utilisateur
            signature_base64 = reponses.get("signature")
            
            if intervention.est_hors_inventaire and intervention.equipement_hors_inventaire:
                eq_hi = intervention.equipement_hors_inventaire
                designation = eq_hi.get('designation') or designation
                marque = eq_hi.get('marque') or marque
                modele = eq_hi.get('modele') or modele
                n_serie = eq_hi.get('numero_serie') or n_serie
        
        sheet.cell(row=row_idx, column=1, value=idx+1)
        sheet.cell(row=row_idx, column=2, value=designation)
        sheet.cell(row=row_idx, column=3, value=marque)
        sheet.cell(row=row_idx, column=4, value=utilisateur)
        # column 5 is Signature (image)
        sheet.cell(row=row_idx, column=6, value=modele)
        sheet.cell(row=row_idx, column=7, value=n_serie)
        
        # Add signature image
        if signature_base64 and ',' in signature_base64:
            try:
                img_data = base64.b64decode(signature_base64.split(',')[1])
                img_io = BytesIO(img_data)
                img = Image(img_io)
                img.height = 40
                img.width = 120
                col_letter = openpyxl.utils.get_column_letter(5)
                sheet.add_image(img, f'{col_letter}{row_idx}')
                sheet.row_dimensions[row_idx].height = 45
            except Exception as e:
                print(f"Error adding signature: {e}")
                pass
        
        for c in range(1, 8):
            cell = sheet.cell(row=ref_row, column=c)
            new_cell = sheet.cell(row=row_idx, column=c)
            if cell.has_style:
                new_cell.font = copy(cell.font)
                new_cell.border = copy(cell.border)
                new_cell.fill = copy(cell.fill)
                new_cell.alignment = copy(cell.alignment)
            
    buffer = BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    return buffer, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", f"Rapport_MSANTE_CAPM_{mission.site.nom if mission.site else ''}.xlsx"

def export_msante_dprf(mission, interventions, equipements):
    template_path = os.path.join(os.path.dirname(__file__), '..', 'templates', 'template_msante_dprf.xlsx')
    wb = openpyxl.load_workbook(template_path)
    
    # We group equipements by sous_site (feuille)
    from collections import defaultdict
    sheets_data = defaultdict(list)
    for eq in equipements:
        feuille = getattr(eq, 'sous_site', None) or 'Nouveau'
        sheets_data[feuille].append(eq)
        
    for sheet_name, eqs in sheets_data.items():
        if sheet_name in wb.sheetnames:
            sheet = wb[sheet_name]
        else:
            # If sheet doesn't exist, duplicate the first one
            sheet = wb.copy_worksheet(wb.worksheets[0])
            sheet.title = str(sheet_name)[:31]
            
        start_row = 10
        ref_row = 10
        
        for idx, eq in enumerate(eqs):
            row_idx = start_row + idx
            intervention = next((i for i in interventions if i.equipement_id == eq.id), None)
            
            designation = getattr(eq, 'designation', None) or getattr(eq, 'famille', None) or getattr(eq, 'type_equipement', None) or ""
            marque = getattr(eq, 'marque', None) or ""
            modele = getattr(eq, 'modele', None) or ""
            n_serie = getattr(eq, 'numero_serie', None) or ""
            utilisateur = getattr(eq, 'utilisateur_nom', None) or ""
            signature_base64 = None
            
            if intervention:
                reponses = intervention.reponses or {}
                eq_mod = reponses.get("equipement_modifie", {})
                designation = eq_mod.get("designation") or designation
                marque = eq_mod.get("marque") or marque
                modele = eq_mod.get("modele") or modele
                n_serie = eq_mod.get("numero_serie") or n_serie
                utilisateur = eq_mod.get("utilisateur") or utilisateur
                signature_base64 = reponses.get("signature")
                
                if intervention.est_hors_inventaire and intervention.equipement_hors_inventaire:
                    eq_hi = intervention.equipement_hors_inventaire
                    designation = eq_hi.get('designation') or designation
                    marque = eq_hi.get('marque') or marque
                    modele = eq_hi.get('modele') or modele
                    n_serie = eq_hi.get('numero_serie') or n_serie
            
            # DPRF Order: N°, Désignation, Utilisateurs, signature, Marque, Article, N° série
            sheet.cell(row=row_idx, column=1, value=idx+1)
            sheet.cell(row=row_idx, column=2, value=designation)
            sheet.cell(row=row_idx, column=3, value=utilisateur)
            # col 4: signature
            sheet.cell(row=row_idx, column=5, value=marque)
            sheet.cell(row=row_idx, column=6, value=modele)
            sheet.cell(row=row_idx, column=7, value=n_serie)
            
            if signature_base64 and ',' in signature_base64:
                try:
                    img_data = base64.b64decode(signature_base64.split(',')[1])
                    img_io = BytesIO(img_data)
                    img = Image(img_io)
                    img.height = 40
                    img.width = 120
                    col_letter = openpyxl.utils.get_column_letter(4)
                    sheet.add_image(img, f'{col_letter}{row_idx}')
                    sheet.row_dimensions[row_idx].height = 45
                except Exception:
                    pass
            
            for c in range(1, 8):
                cell = sheet.cell(row=ref_row, column=c)
                new_cell = sheet.cell(row=row_idx, column=c)
                if cell.has_style:
                    new_cell.font = copy(cell.font)
                    new_cell.border = copy(cell.border)
                    new_cell.fill = copy(cell.fill)
                    new_cell.alignment = copy(cell.alignment)

    buffer = BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    return buffer, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", f"Rapport_MSANTE_DPRF_{mission.site.nom if mission.site else ''}.xlsx"

def exporter_mission(mission, interventions, equipements):
    """
    Point d'entrée pour l'export. Détermine le bon format.
    """
    t = ""
    if mission.site and mission.site.marche:
        if "ANCFCC" in mission.site.marche.nom.upper():
            t = "ANCFCC"
                elif "ANP" in mission.site.marche.nom.upper():
            t = "ANP"
        elif "MSANTE" in mission.site.marche.nom.upper():
            if mission.site.checklist_type == 'MSANTE_CAPM':
                t = 'MSANTE_CAPM'
            elif mission.site.checklist_type == 'MSANTE_DPRF':
                t = 'MSANTE_DPRF'
    
    if t == 'ANCFCC':
        return export_ancfcc(mission, interventions, equipements)
    elif t == 'ANP':
        return export_anp(mission, interventions, equipements)
    elif t == 'MSANTE_CAPM':
        return export_msante_capm(mission, interventions, equipements)
    elif t == 'MSANTE_DPRF':
        return export_msante_dprf(mission, interventions, equipements)
    else:
        # Par défaut, on exporte façon MSANTE (Excel) pour tous les autres marchés pour le PoC
        return export_msante(mission, interventions, equipements)
