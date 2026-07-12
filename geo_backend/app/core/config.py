from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # --- General (no sensible, default está bien) ---
    PROJECT_NAME: str = "GeoField API"
    ENVIRONMENT: str = "development"  # development | production

    # --- Base de datos (PostgreSQL + PostGIS) ---
    # SIN default: si falta en .env, pydantic tira ValidationError al arrancar
    # en vez de conectarse silenciosamente a un valor hardcodeado en el repo.
    DATABASE_URL: str

    # --- JWT / Autenticación ---
    # SIN default por el mismo motivo: nunca queremos firmar tokens con
    # un secreto que está público en GitHub.
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 horas

    # --- CORS (no sensible) ---
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    # Directorio donde se guardan las fotos subidas
    MEDIA_DIR: Path = Path("media/fotos")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()

# Crear el directorio si no existe al arrancar
settings.MEDIA_DIR.mkdir(parents=True, exist_ok=True)