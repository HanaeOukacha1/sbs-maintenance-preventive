import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.models.json_schema import JsonSchema

SCHEMAS = [
    {
        "nom": "Schema ADM",
        "type_equipement": "SERVEUR",
        "description": "Schéma pour les serveurs DELL de ADM",
        "schema_data": {
            "type": "object",
            "properties": {
                "processeur": { "type": "string", "title": "Processeur" },
                "memoire": { "type": "string", "title": "Composants – Mémoire en MB" },
                "disque_c": { "type": "string", "title": "Composants - Taille du disque dur C en MB" },
                "disque_d": { "type": "string", "title": "Composants - Taille du disque dur D en MB" },
                "ip": { "type": "string", "title": "Réseau - IP" },
                "etat_sw": { "type": "boolean", "title": "Etat Software (OK/NON)" },
                "etat_hw": { "type": "boolean", "title": "Etat Hardware (OK/NON)" }
            }
        }
    },
    {
        "nom": "Schema AMEE",
        "type_equipement": "TOUS",
        "description": "Schéma pour les PC, serveurs et imprimantes de l'AMEE",
        "schema_data": {
            "type": "object",
            "properties": {
                "utilisateur": { "type": "string", "title": "UTILISATEUR" },
                "cpu": { "type": "string", "title": "CPU" },
                "ram": { "type": "string", "title": "RAM" },
                "stockage": { "type": "string", "title": "Stockage" },
                "sysexp": { "type": "string", "title": "SYSEXP" },
                "antivirus": { "type": "string", "title": "ANTIVIRUS" },
                "etat_system": { "type": "string", "title": "Etat System", "enum": ["ACTIVE", "INACTIVE"] },
                "etat_antivirus": { "type": "string", "title": "Etat Antivirus", "enum": ["ACTIF", "EXPIRE"] },
                "mise_a_jour": { "type": "string", "title": "Mise à Jour", "enum": ["OK", "MANQUANTE"] }
            }
        }
    },
    {
        "nom": "Schema ANCFCC",
        "type_equipement": "ONDULEUR",
        "description": "Schéma pour les onduleurs Riello de l'ANCFCC",
        "schema_data": {
            "type": "object",
            "properties": {
                "puissance": { "type": "string", "title": "Puissance de l'onduleur" },
                "nb_batteries": { "type": "string", "title": "Nombre des batteries" },
                "cab": { "type": "string", "title": "C à B" }
            }
        }
    },
    {
        "nom": "Schema ANP",
        "type_equipement": "TOUS",
        "description": "Schéma général pour l'ANP",
        "schema_data": {
            "type": "object",
            "properties": {
                "emplacement": { "type": "string", "title": "Emplacement" },
                "affectation": { "type": "string", "title": "Affectation / Utilisateur" },
                "observation": { "type": "string", "title": "Observation" }
            }
        }
    },
    {
        "nom": "Schema AOH",
        "type_equipement": "TOUS",
        "description": "Schéma général pour Al Omrane Holding",
        "schema_data": {
            "type": "object",
            "properties": {
                "emplacement": { "type": "string", "title": "Emplacement" },
                "affectation": { "type": "string", "title": "Affectation / Utilisateur" },
                "observation": { "type": "string", "title": "Observation" }
            }
        }
    },
    {
        "nom": "Schema CNDH",
        "type_equipement": "TOUS",
        "description": "Schéma avec état pour CNDH",
        "schema_data": {
            "type": "object",
            "properties": {
                "entite": { "type": "string", "title": "ENTITE" },
                "emplacement": { "type": "string", "title": "EMPLACEMENT" },
                "affectation": { "type": "string", "title": "AFFECTATION" },
                "etat": { "type": "string", "title": "ETAT", "enum": ["BON", "DEFAILLANT", "A REMPLACER"] },
                "observation": { "type": "string", "title": "OBSERVATION" }
            }
        }
    },
    {
        "nom": "Schema INPPLC",
        "type_equipement": "TOUS",
        "description": "Schéma spécifique pour INPPLC (basé sur la fiche Word imprimantes/scanners et infos globales)",
        "schema_data": {
            "type": "object",
            "properties": {
                "inventaire": { "type": "string", "title": "N° Inventaire" },
                "op1": { "type": "boolean", "title": "Diagnostic du bon état de fonctionnement" },
                "op2": { "type": "boolean", "title": "Dépoussiérage interne et externe" },
                "op3": { "type": "boolean", "title": "Vérification des composants: rouleaux, four, kit de transfer" },
                "op4": { "type": "boolean", "title": "Nettoyage extérieur" },
                "op5": { "type": "boolean", "title": "Test d'impression" }
            }
        }
    },
    {
        "nom": "Schema MARSA MAROC",
        "type_equipement": "TOUS",
        "description": "Schéma général pour Marsa Maroc",
        "schema_data": {
            "type": "object",
            "properties": {
                "emplacement": { "type": "string", "title": "Emplacement" },
                "affectation": { "type": "string", "title": "Affectation / Utilisateur" },
                "observation": { "type": "string", "title": "Observation" }
            }
        }
    },
    {
        "nom": "Schema MHAI - PC / Serveur",
        "type_equipement": "PC_SERVEUR",
        "description": "Schéma MHAI pour les ordinateurs et serveurs",
        "schema_data": {
            "type": "object",
            "properties": {
                "inventaire": { "type": "string", "title": "N° Inventaire" },
                "processeur": { "type": "string", "title": "Processeur" },
                "ram": { "type": "string", "title": "Ram" },
                "disque_dur": { "type": "string", "title": "Disque dur" },
                "os": { "type": "string", "title": "Systéme d'exploitation" },
                "office": { "type": "string", "title": "Microsoft Office" },
                "antivirus": { "type": "string", "title": "Solution Antiviral" },
                "op1": { "type": "boolean", "title": "Diagnostic du bon état de fonctionnement" },
                "op2": { "type": "boolean", "title": "Dépoussiérage interne et externe" },
                "op3": { "type": "boolean", "title": "Nettoyage extérieur" }
            }
        }
    },
    {
        "nom": "Schema MHAI - Imprimante / Scanner",
        "type_equipement": "IMPRIMANTE_SCANNER",
        "description": "Schéma MHAI pour les équipements d'impression",
        "schema_data": {
            "type": "object",
            "properties": {
                "inventaire": { "type": "string", "title": "N° Inventaire" },
                "op1": { "type": "boolean", "title": "Diagnostic du bon état de fonctionnement" },
                "op2": { "type": "boolean", "title": "Dépoussiérage interne et externe" },
                "op3": { "type": "boolean", "title": "Vérification des composants: rouleaux, four, kit de transfer" },
                "op4": { "type": "boolean", "title": "Nettoyage extérieur" },
                "op5": { "type": "boolean", "title": "Test d'impression" }
            }
        }
    },
    {
        "nom": "Schema MSANTE",
        "type_equipement": "TOUS",
        "description": "Schéma avec état pour MSANTE",
        "schema_data": {
            "type": "object",
            "properties": {
                "entite": { "type": "string", "title": "ENTITE" },
                "emplacement": { "type": "string", "title": "EMPLACEMENT" },
                "affectation": { "type": "string", "title": "AFFECTATION" },
                "etat": { "type": "string", "title": "ETAT", "enum": ["BON", "DEFAILLANT", "A REMPLACER"] },
                "observation": { "type": "string", "title": "OBSERVATION" }
            }
        }
    },
    {
        "nom": "Schema ONP",
        "type_equipement": "TOUS",
        "description": "Schéma général pour ONP",
        "schema_data": {
            "type": "object",
            "properties": {
                "emplacement": { "type": "string", "title": "Emplacement" },
                "affectation": { "type": "string", "title": "Affectation / Utilisateur" },
                "observation": { "type": "string", "title": "Observation" }
            }
        }
    }
]


def seed_schemas():
    db: Session = SessionLocal()
    try:
        print("=" * 60)
        print("SEED JSON SCHEMAS (Formulaires Dynamiques - 1 par marché)")
        print("=" * 60)

        count = 0
        for s_data in SCHEMAS:
            # Vérifier si le schéma existe déjà
            existing = db.query(JsonSchema).filter(JsonSchema.nom == s_data["nom"]).first()
            if not existing:
                schema = JsonSchema(
                    nom=s_data["nom"],
                    type_equipement=s_data["type_equipement"],
                    version=1,
                    schema_data=s_data["schema_data"],
                    is_active=True,
                    description=s_data["description"]
                )
                db.add(schema)
                count += 1
                print(f"  ✅ Créé : {s_data['nom']}")
            else:
                print(f"  ℹ️  Déjà existant : {s_data['nom']}")

        db.commit()
        print("=" * 60)
        print(f"✅ Terminé ! {count} nouveaux schémas insérés.")
        print("=" * 60)
    except Exception as e:
        db.rollback()
        print(f"❌ Erreur : {e}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_schemas()
