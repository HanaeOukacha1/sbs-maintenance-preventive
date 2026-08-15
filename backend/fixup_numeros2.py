"""
Correction manuelle des numéros manqués (AMEE, ANCFCC, MSANTE, CNDH, INPPLC)
"""
import sys
sys.stdout.reconfigure(encoding='utf-8')

from app.db.database import engine
from sqlalchemy.orm import Session
from sqlalchemy import text

# Numéros manquants trouvés dans les fichiers analyse_rapport.json et analyse_words.json
# et en inspectant les fichiers directement
CORRECTIONS = {
    14: ("29/2025",       "AGENCE MAROCAINE POUR L'EFFICACITE ENERGETIQUE | Marché N° 29/2025"),      # AMEE
    15: ("M132/2024",     "ANCFCC - Agence Nationale de Conservation Foncière du Cadastre et de la Cartographie"),  # ANCFCC (à corriger si autre numéro)
    # MSANTE - pas de numéro spécifique car plusieurs marchés MSANTE
    # CNDH - pas trouvé de numéro
    # INPPLC - pas de numéro visible
}

def main():
    with Session(engine) as session:
        for marche_id, (numero, infos) in CORRECTIONS.items():
            # Ne mettre à jour que si encore NULL
            result = session.execute(
                text("SELECT nom, numero FROM marches WHERE id = :id"),
                {"id": marche_id}
            ).fetchone()
            if result:
                print(f"[{marche_id}] {result[0]} → actuel N°={result[1]} → correction N°={numero}")
                session.execute(
                    text("UPDATE marches SET numero = :numero, informations_entete = :infos WHERE id = :id AND (numero IS NULL OR numero = '')"),
                    {"numero": numero, "infos": infos, "id": marche_id}
                )
        session.commit()
        print("Terminé !")

if __name__ == "__main__":
    main()
