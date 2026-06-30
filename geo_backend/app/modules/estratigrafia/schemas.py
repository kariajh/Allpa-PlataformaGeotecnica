# app/modules/estratigrafia/schemas.py
import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, field_validator, model_validator

from app.shared.enums import (
    ConsistenciaEstrato,
    HumedadEstrato,
    SyncStatus,
    TexturaEstrato,
    TipoMuestra,
)


# ── Estrato ──────────────────────────────────────────────────────────────────

class EstratoCreate(BaseModel):
    sondeo_id: uuid.UUID
    device_id: str
    prof_tope: float
    prof_base: float
    color: str
    textura: TexturaEstrato
    consistencia: ConsistenciaEstrato | None = None
    humedad: HumedadEstrato | None = None
    descripcion_libre: str | None = None

    @model_validator(mode="after")
    def validar_profundidades(self) -> "EstratoCreate":
        if self.prof_tope < 0 or self.prof_base < 0:
            raise ValueError("Las profundidades no pueden ser negativas")
        if self.prof_tope >= self.prof_base:
            raise ValueError(
                "prof_tope debe ser menor que prof_base "
                f"(recibido: tope={self.prof_tope}, base={self.prof_base})"
            )
        return self


class EstratoOut(BaseModel):
    id: uuid.UUID
    sondeo_id: uuid.UUID
    prof_tope: float
    prof_base: float
    color: str
    textura: TexturaEstrato
    consistencia: ConsistenciaEstrato | None
    humedad: HumedadEstrato | None
    descripcion_libre: str | None
    device_id: str
    sync_status: SyncStatus
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ── Muestra ───────────────────────────────────────────────────────────────────

class MuestraCreate(BaseModel):
    sondeo_id: uuid.UUID
    device_id: str
    tipo: TipoMuestra
    profundidad: float
    diametro_mm: int | None = None
    recuperacion_pct: float | None = None

    @field_validator("profundidad")
    @classmethod
    def validar_profundidad(cls, v: float) -> float:
        if v < 0:
            raise ValueError("La profundidad no puede ser negativa")
        return v

    @field_validator("recuperacion_pct")
    @classmethod
    def validar_recuperacion(cls, v: float | None) -> float | None:
        if v is not None and not (0 <= v <= 100):
            raise ValueError("La recuperación debe estar entre 0 y 100%")
        return v


class MuestraOut(BaseModel):
    id: uuid.UUID
    sondeo_id: uuid.UUID
    codigo: str
    tipo: TipoMuestra
    profundidad: float
    diametro_mm: int | None
    recuperacion_pct: float | None
    qr_code: str
    device_id: str
    sync_status: SyncStatus
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)