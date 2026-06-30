# app/modules/sondeos/schemas.py
import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, field_validator

from app.shared.enums import EstadoSondeo, SyncStatus, TipoSondeo


class SondeoBase(BaseModel):
    codigo: str
    tipo: TipoSondeo
    latitud: float
    longitud: float
    cota: float | None = None
    profundidad_total: float | None = None


class SondeoCreate(SondeoBase):
    """Datos enviados desde el dispositivo de campo para crear un sondeo."""
    proyecto_id: uuid.UUID
    device_id: str

    @field_validator("latitud")
    @classmethod
    def validar_latitud(cls, v: float) -> float:
        if not (-90 <= v <= 90):
            raise ValueError("La latitud debe estar entre -90 y 90")
        return v

    @field_validator("longitud")
    @classmethod
    def validar_longitud(cls, v: float) -> float:
        if not (-180 <= v <= 180):
            raise ValueError("La longitud debe estar entre -180 y 180")
        return v


class SondeoCerrarRequest(BaseModel):
    """Datos requeridos para cerrar y firmar un sondeo (CU-03)."""
    operador: str
    device_id: str


class SondeoReabrirRequest(BaseModel):
    """Datos requeridos para reabrir un sondeo cerrado (RN-09)."""
    operador: str
    device_id: str
    motivo: str  # obligatorio para auditoría


class SondeoOut(SondeoBase):
    id: uuid.UUID
    proyecto_id: uuid.UUID
    estado: EstadoSondeo
    firma_digital: str | None = None
    device_id: str
    sync_status: SyncStatus
    version: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)