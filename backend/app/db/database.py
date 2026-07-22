from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.core.config import settings


# ============================================================
# MOTEUR DE CONNEXION
# ============================================================
# create_engine() crée le "moteur" qui gère la connexion MySQL.
# L'URL vient du .env : mysql+pymysql://root:@localhost:3306/sbs_db
#   - mysql+pymysql : on utilise le driver PyMySQL
#   - root          : utilisateur MySQL
#   - (vide)        : pas de mot de passe (XAMPP par défaut)
#   - localhost     : MySQL tourne sur notre propre machine
#   - 3306          : port MySQL par défaut
#   - sbs_db        : nom de notre base de données
engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,  # En mode DEBUG, affiche les requêtes SQL dans la console
)


# ============================================================
# FACTORY DE SESSION
# ============================================================
# SessionLocal est une "fabrique" : chaque appel à SessionLocal()
# crée une nouvelle session (connexion) avec la base de données.
# autocommit=False → on valide les changements manuellement (db.commit())
# autoflush=False  → les changements ne sont pas envoyés automatiquement
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# ============================================================
# CLASSE DE BASE POUR LES MODÈLES
# ============================================================
# Tous nos modèles (tables) vont hériter de cette classe Base.
# Ça permet à Alembic et SQLAlchemy de les "voir" et les gérer.
class Base(DeclarativeBase):
    pass


# ============================================================
# DÉPENDANCE FASTAPI — Injection de session
# ============================================================
# Cette fonction est injectée dans chaque route FastAPI qui a
# besoin d'accéder à la BDD. Elle ouvre une session, la passe
# à la route, puis la ferme proprement après (même en cas d'erreur).
def get_db():
    db = SessionLocal()
    try:
        yield db          # La route reçoit la session "db"
    finally:
        db.close()        # Toujours fermée après usage
