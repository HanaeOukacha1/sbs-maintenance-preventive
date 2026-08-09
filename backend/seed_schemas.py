# coding: utf-8
import sys
import os
import json
from sqlalchemy.orm import Session
from app.db.database import SessionLocal, engine
from app.models.json_schema import JsonSchema

db = SessionLocal()

FIELD_LABELS = {
    "etat_software": {"label": "État Software", "options": ["OK", "Non"]},
    "etat_hardware": {"label": "État Hardware", "options": ["OK", "Non"]},
    "etat":          {"label": "État Général", "options": ["OK", "Non"]},
    "statut":        {"label": "Statut", "options": ["OK", "Non"]},
    "observation":   {"label": "Observation", "options": ["BON", "DÉFAILLANT", "À RÉPARER"]},
    "observation_cndh": {"label": "Observation", "options": ["Bon", "En panne", "En réparation"]},
    "etat_msante":   {"label": "État", "options": ["BON", "EN PANNE", "À RÉPARER"]},
}

CHECKLIST_FIELDS = {
    "ADM":             ["etat_software", "etat_hardware"],
    "AMEE_MARRAKECH":  ["statut"],
    "AMEE_RABAT":      ["statut"],
    "ANCFCC":          [], 
    "ANP":             ["etat"],
    "AOH":             ["etat"],
    "INPPLC":          ["observation"],
    "MARSA_MAROC":     ["observation"],
    "MHAI":            ["observation"],
    "MSANTE_STANDARD": ["etat_msante"],
    "MSANTE_CAPM":     ["etat_msante"],
    "MSANTE_DPRF":     ["etat_msante"],
    "ONP":             ["etat"],
    "CNDH_G1":         ["observation_cndh"],
    "CNDH_G2":         ["observation_cndh"],
    "CNDH_SIEGE":      ["observation_cndh"],
}

ONDULEUR_TEMPLATE = [
    {"key": "pt1", "label": "Vérification du matériel", "options": ["oui", "non"]},
    {"key": "pt2", "label": "Contrôle des différents paramètres électriques en entrée/sortie", "options": ["oui", "non"]},
    {"key": "pt3", "label": "Contrôle du bruit des différents composants mécaniques", "options": ["oui", "non"]},
    {"key": "pt4", "label": "Test de simulation de fonctionnement du matériel (sur batteries, by-pass...)", "options": ["oui", "non"]},
    {"key": "pt5", "label": "Vérification de la carte SNMP et la communication à distance", "options": ["oui", "non"]},
    {"key": "pt6", "label": "Contrôle de l'ensemble des batteries", "options": ["oui", "non"]},
    {"key": "pt7", "label": "Réparation de tout défaut constaté si nécessaire", "options": ["oui", "non"]},
    {"key": "pt8", "label": "Ouvrir un incident (maintenance curative), en cas de panne matériel, en vue de : a. Réparation de tout défaut constaté b. Remplacement de tout composant reconnu défectueux pendant la visite", "options": ["oui", "non"]},
    {"key": "pt9", "label": "Nettoyage et dépoussiérage", "options": ["oui", "non"]},
    {"key": "pt10", "label": "Rédaction d'un rapport de synthèse à l'issue de la visite", "options": ["oui", "non"]},
]

ADM_TEMPLATE = [
    {"key": "adm1", "label": "Vérification des journaux d'événements (Event Logs)", "options": ["oui", "non"]},
    {"key": "adm2", "label": "Contrôle des mises à jour système (OS)", "options": ["oui", "non"]},
    {"key": "adm3", "label": "Vérification de l'état de la mémoire (RAM)", "options": ["oui", "non"]},
    {"key": "adm4", "label": "Vérification de l'état des disques (Espace & SMART)", "options": ["oui", "non"]},
    {"key": "adm5", "label": "Contrôle de la connectivité réseau", "options": ["oui", "non"]},
    {"key": "adm6", "label": "Vérification de l'état des sauvegardes", "options": ["oui", "non"]},
    {"key": "adm7", "label": "Contrôle des paramètres de sécurité (Antivirus/Firewall)", "options": ["oui", "non"]},
    {"key": "adm8", "label": "Nettoyage physique (dépoussiérage) si nécessaire", "options": ["oui", "non"]},
    {"key": "adm9", "label": "Vérification du fonctionnement des ventilateurs", "options": ["oui", "non"]},
    {"key": "adm10", "label": "Rédaction d'un rapport de synthèse de l'intervention", "options": ["oui", "non"]},
]

AMEE_MISE_A_JOUR = [
    {"key": "nettoyage_disque", "label": "Nettoyage de disque", "options": ["OK", "NON"]},
    {"key": "fichiers_temporaires", "label": "Fichiers temporaires", "options": ["OK", "NON"]},
    {"key": "maj_windows", "label": "Mise à jour Windows", "options": ["OK", "NON"]}
]

AMEE_AVANCEE = [
    {"key": "etat_systeme", "label": "État Système", "options": ["ACTIVE", "INACTIF"]},
    {"key": "etat_antivirus", "label": "État Antivirus", "options": ["ACTIVE", "EXPIRE"]},
    {"key": "maj", "label": "Mise à Jour", "options": ["À JOUR", "MANQUANTE"]}
]

def create_schema(nom, type_eq, schema_data):
    # Chercher si le schéma existe déjà
    existing = db.query(JsonSchema).filter(JsonSchema.nom == nom).first()
    if existing:
        existing.schema_data = schema_data
        existing.type_equipement = type_eq
    else:
        new_schema = JsonSchema(nom=nom, type_equipement=type_eq, version=1, schema_data=schema_data, is_active=True)
        db.add(new_schema)

def run():
    # 1. Onduleur
    create_schema("ONDULEUR", "ONDULEUR", ONDULEUR_TEMPLATE)
    
    # 2. AMEE Spécifiques
    create_schema("AMEE_MISE_A_JOUR", "PC/SERVEUR", AMEE_MISE_A_JOUR)
    create_schema("AMEE_AVANCEE", "PC/SERVEUR", AMEE_AVANCEE)

    # 3. Les autres checklists par défaut
    for key, fields in CHECKLIST_FIELDS.items():
        template = []
        for f in fields:
            label = FIELD_LABELS.get(f, {}).get("label", f)
            options = FIELD_LABELS.get(f, {}).get("options", ["OK", "Non"])
            template.append({"key": f, "label": label, "options": options})
        
        if key == "ADM":
            template.extend(ADM_TEMPLATE)
            
        create_schema(key, "GLOBAL", template)

    db.commit()
    print("Seed JSON Schemas terminé !")

if __name__ == "__main__":
    run()
