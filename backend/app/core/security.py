from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.core.config import settings

# ============================================================
# CONFIGURATION BCRYPT
# ============================================================
# CryptContext dit à passlib d'utiliser bcrypt pour hacher.
# bcrypt est l'algorithme de hachage le plus sûr pour les mots de passe.
# "deprecated=auto" met à jour automatiquement les anciens hashs.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """
    Transforme un mot de passe en clair en hash bcrypt.
    Exemple :
      "admin123" → "$2b$12$abc...xyz" (60 caractères illisibles)
    Ce hash est ce qu'on stocke dans la BDD.
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Vérifie si un mot de passe en clair correspond à un hash.
    Retourne True si c'est correct, False sinon.
    Exemple :
      verify_password("admin123", "$2b$12$abc...xyz") → True
      verify_password("mauvais",  "$2b$12$abc...xyz") → False
    """
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict) -> str:
    """
    Crée un token JWT signé.
    
    Le token contient :
    - Les données de l'utilisateur (ex: {"sub": "email@sbs.ma", "role": "TECHNICIEN"})
    - Une date d'expiration (calculée depuis ACCESS_TOKEN_EXPIRE_MINUTES dans .env)
    
    Le token est signé avec SECRET_KEY → impossible à falsifier sans la clé.
    
    Exemple de token généré (3 parties séparées par des points) :
    eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJoYW5hZUBzYnMubWEifQ.xyz
         HEADER                        PAYLOAD                SIGNATURE
    """
    to_encode = data.copy()

    # Calcul de la date d'expiration
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    to_encode.update({"exp": expire})

    # Encodage et signature du token avec notre clé secrète
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM  # HS256 = HMAC + SHA256
    )
    return encoded_jwt


def decode_access_token(token: str) -> dict | None:
    """
    Décode et vérifie un token JWT.
    Retourne les données si le token est valide et non expiré.
    Retourne None si le token est invalide ou expiré.
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError:
        return None
