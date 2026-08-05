from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.database import Base, engine
import app.models  # noqa: F401 — importe tous les modèles pour que SQLAlchemy les connaisse

# Import des routers
from app.api.v1 import auth as auth_router
from app.api.v1 import marches as marches_router
from app.api.v1 import sites as sites_router
from app.api.v1 import equipements as equipements_router
from app.api.v1 import users as users_router
from app.api.v1 import json_schemas as json_schemas_router
from app.api.v1 import missions as missions_router
from app.api.v1 import interventions as interventions_router

# ============================================================
# CRÉATION DE L'APPLICATION FASTAPI
# ============================================================
app = FastAPI(
    title=settings.APP_NAME,
    description="API centrale pour la gestion de la maintenance préventive IT chez SBS",
    version="1.0.0",
    # Active la documentation Swagger seulement en mode DEBUG
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

# ============================================================
# MIDDLEWARE CORS
# ============================================================
# Autorise le frontend React (localhost:5173) et l'app mobile
# Expo (localhost:8081) à appeler notre API (localhost:8000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",   # Frontend React (Vite)
        "http://localhost:3000",   # Autre port React possible
        "http://localhost:8081",   # Expo mobile
        "http://localhost:19000",  # Expo Go
    ],
    allow_credentials=True,
    allow_methods=["*"],           # GET, POST, PUT, DELETE...
    allow_headers=["*"],           # Authorization, Content-Type...
    expose_headers=["Content-Disposition"], # Nécessaire pour récupérer le nom du fichier
)

# ============================================================
# CRÉATION DES TABLES AU DÉMARRAGE
# ============================================================
# Crée automatiquement toutes les tables définies dans les modèles
# si elles n'existent pas encore dans MySQL.
# Plus tard on utilisera Alembic pour les migrations.
@app.on_event("startup")
def create_tables():
    Base.metadata.create_all(bind=engine)
    print("✅ Tables vérifiées / créées dans MySQL")

# ============================================================
# ROUTES DE BASE (TEST)
# ============================================================
# ============================================================
# INCLUSION DES ROUTERS
# ============================================================
# Chaque router gère un groupe de routes (auth, users, marchés...)
# prefix="/api/v1" → toutes les routes commencent par /api/v1/...
app.include_router(auth_router.router, prefix="/api/v1")
app.include_router(users_router.router, prefix="/api/v1")
app.include_router(marches_router.router, prefix="/api/v1")
app.include_router(sites_router.router, prefix="/api/v1")
app.include_router(equipements_router.router, prefix="/api/v1")
app.include_router(json_schemas_router.router, prefix="/api/v1")
app.include_router(missions_router.router, prefix="/api/v1")
app.include_router(interventions_router.router, prefix="/api/v1")


@app.get("/", tags=["Santé"])
def root():
    return {
        "message": f"Bienvenue sur l'API {settings.APP_NAME}",
        "version": "1.0.0",
        "status": "ok",
        "docs": "/docs"
    }

@app.get("/health", tags=["Santé"])
def health_check():
    return {"status": "healthy", "database": "MySQL (XAMPP)"}
