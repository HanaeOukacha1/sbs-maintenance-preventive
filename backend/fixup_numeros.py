"""
Script de post-traitement pour extraire les numéros de marché cachés dans les informations_entete
et les sauvegarder correctement dans le champ 'numero'.
"""
import sys
import re

sys.stdout.reconfigure(encoding='utf-8')

from app.db.database import engine
from sqlalchemy.orm import Session
from sqlalchemy import text

def main():
    with Session(engine) as session:
        # Récupérer tous les marchés qui ont des infos mais pas de numéro
        result = session.execute(
            text("SELECT id, nom, numero, informations_entete FROM marches")
        ).fetchall()

        updates = []

        for row in result:
            mid, mnom, numero, infos = row[0], row[1], row[2], row[3]
            
            if not infos:
                continue

            # Si pas encore de numéro, essayer d'en extraire un depuis les infos
            if not numero:
                # Patterns à chercher dans les infos
                patterns = [
                    r"MARCHE\s+CADRE\s+N°\s*([\w\/\.\-]+)",
                    r"MARCH[ÉE]\s+N°?\s*([\w\/\.\-]+)",
                    r"N°\s*([\w\/\.\-]+)",
                    r"March[eé]\s*[:\-]?\s*N°([\w\/\.\-]+)",
                ]
                for pattern in patterns:
                    m = re.search(pattern, infos, re.IGNORECASE)
                    if m:
                        candidate = m.group(1).strip().rstrip('|').strip()
                        if len(candidate) > 2 and candidate not in ['N°', 'N', 'du']:
                            numero = candidate
                            print(f"✅ [{mnom}] ID={mid} → Numéro trouvé: {numero}")
                            updates.append((mid, numero))
                            break

        if updates:
            print(f"\n🔄 Mise à jour de {len(updates)} marchés...\n")
            for mid, numero in updates:
                session.execute(
                    text("UPDATE marches SET numero = :numero WHERE id = :id"),
                    {"numero": numero, "id": mid}
                )
                session.commit()
            print("✅ Mise à jour terminée!")
        else:
            print("ℹ️  Aucun numéro supplémentaire à extraire.")

        # Afficher le résumé final
        print("\n========== État final des marchés ==========")
        result = session.execute(
            text("SELECT id, nom, numero, informations_entete FROM marches ORDER BY id")
        ).fetchall()
        for row in result:
            mid, mnom, numero, infos = row
            print(f"  [{mid}] {mnom:<20} | N°: {numero or 'N/A':<20} | Infos: {str(infos)[:50] if infos else 'N/A'}")

if __name__ == "__main__":
    main()
