import os
from io import BytesIO
from docxtpl import DocxTemplate
import openpyxl
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
        "puissance_kva": eq.puissance_kva if eq else "",
        "zone": eq.zone if eq else "",
        "nb_batteries": eq.nb_batteries if eq else "",
        "ville": mission.site_ville or "",
        "marque_modele": f"{eq.marque} {eq.modele}" if eq else "",
        "etablissement": mission.site_nom or "",
        "nom_site": mission.site_nom or "",
        "numero_serie": eq.numero_serie if eq else "",
        "capacite_batteries": getattr(eq, 'capacite_batteries', '') if eq else "",
    }
    
    # Mapping de la checklist (10 points)
    # Les clés dans 'reponses' sont des entiers sous forme de string: '0', '1', ...
    for i in range(10):
        rep = reponses.get(str(i)) or reponses.get(i) or {}
        val_oui = "X" if rep.get("reponse") == "oui" else ""
        obs = rep.get("observation") or ""
        
        context[f"pt{i+1}_oui"] = val_oui
        context[f"pt{i+1}_obs"] = obs

    doc.render(context)
    
    buffer = BytesIO()
    doc.save(buffer)
    buffer.seek(0)
    
    return buffer, "application/vnd.openxmlformats-officedocument.wordprocessingml.document", f"Rapport_ANCFCC_{mission.site_nom}.docx"


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
    sheet["A6"] = mission.site_ville or ""
    # Période = semestre actuel
    today = date.today()
    semestre = 1 if today.month <= 6 else 2
    sheet["D6"] = f"Période : {semestre}ème semestre {today.year}"
    
    # Affectation
    sheet["A7"] = f"Affectation : {mission.site_nom}"
    
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
    
    for idx, intervention in enumerate(interventions):
        row_idx = start_row + idx
        eq = next((e for e in equipements if e.id == intervention.equipement_id), None)
        
        # Valeurs par défaut si hors inventaire
        designation = eq.designation if eq else ""
        marque = eq.marque if eq else ""
        modele = eq.modele if eq else ""
        n_serie = eq.numero_serie if eq else ""
        
        if intervention.est_hors_inventaire and intervention.equipement_hors_inventaire:
            eq_hi = intervention.equipement_hors_inventaire
            designation = eq_hi.get('designation', designation)
            n_serie = eq_hi.get('numero_serie', n_serie)
        
        reponses = intervention.reponses or {}
        observation = reponses.get("observation", "")
        
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
    
    return buffer, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", f"Rapport_MSANTE_{mission.site_nom}.xlsx"


def exporter_mission(mission, interventions, equipements):
    """
    Point d'entrée pour l'export. Détermine le bon format.
    """
    t = mission.checklist_type
    
    if t == 'ANCFCC':
        return export_ancfcc(mission, interventions, equipements)
    else:
        # Par défaut, on exporte façon MSANTE (Excel) pour tous les autres marchés pour le PoC
        return export_msante(mission, interventions, equipements)
