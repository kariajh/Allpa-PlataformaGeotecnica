# app/core/config.py
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # --- General ---
    PROJECT_NAME: str = "GeoField API"
    ENVIRONMENT: str = "development"  # development | production

    # --- Base de datos (PostgreSQL + PostGIS) ---
    DATABASE_URL: str = "postgresql://REDACTED:REDACTED@localhost:5432/geofield_db"

    # --- JWT / Autenticación ---
    SECRET_KEY: str = "CAMBIAR_ESTO_EN_PRODUCCION"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 horas

    # --- CORS ---
    # Orígenes permitidos para el frontend (Vite corre por defecto en 5173)
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