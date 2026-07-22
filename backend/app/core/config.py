# pyrefly: ignore [missing-import]
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """
    Classe de configuration centrale.
    Pydantic lit automatiquement le fichier .env et mappe
    chaque variable à l'attribut correspondant.
    """

    # Base de données
    DATABASE_URL: str

    # Sécurité JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    # Application
    APP_NAME: str = "SBS Maintenance Préventive"
    DEBUG: bool = True

    class Config:
        # Indique à Pydantic où trouver le fichier de config
        env_file = ".env"
        env_file_encoding = "utf-8"


# Instance unique utilisée dans tout le projet
# On importe "settings" depuis n'importe quel fichier
settings = Settings()
