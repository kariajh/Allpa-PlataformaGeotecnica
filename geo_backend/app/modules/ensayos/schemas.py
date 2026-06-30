# app/modules/ensayos/schemas.py
import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator, model_validator

from app.shared.enums import SyncStatus, TipoMartillo


class EnsayoSPTCreate(BaseModel):
    """
    Datos que el cliente envía para registrar un ensayo SPT.
    n_campo y n60 NO se incluyen — son calculados por el servidor (RN-03).
    """
    sondeo_id: uuid.UUID
    device_id: str
    profundidad: float
    tipo_martillo: TipoMartillo
    diametro_mm: int
    longitud_varillaje: float
    golpes_t1: int
    golpes_t2: int | None = None
    golpes_t3: int | None = None

    @field_validator("profundidad")
    @classmethod
    def validar_profundidad(cls, v: float) -> float:
        if v < 0:
            raise ValueError("La profundidad no puede ser negativa")
        return v

    @field_validator("golpes_t1", "golpes_t2", "golpes_t3", mode="before")
    @classmethod
    def validar_golpes(cls, v: int | None) -> int | None:
        if v is not None and v < 0:
            raise ValueError("Los golpes no pueden ser negativos")
        return v

    @model_validator(mode="after")
    def validar_tramos(self) -> "EnsayoSPTCreate":
        """
        Si T1 < 50 (no rechazo), T2 y T3 son obligatorios.
        Si T1 >= 50 (rechazo), T2 y T3 deben ser None.
        """
        if self.golpes_t1 < 50:
            if self.golpes_t2 is None or self.golpes_t3 is None:
                raise ValueError(
                    "Si T1 < 50, los tramos T2 y T3 son obligatorios"
                )
        return self


class EnsayoSPTOut(BaseModel):
    """Lo que la API devuelve al consultar un ensayo SPT."""
    id: uuid.UUID
    sondeo_id: uuid.UUID
    profundidad: float
    tipo_martillo: TipoMartillo
    eficiencia_er: float
    diametro_mm: int
    longitud_varillaje: float
    golpes_t1: int
    golpes_t2: int | None
    golpes_t3: int | None
    n_campo: int | None
    n60: float | None
    rechazo: bool
    device_id: str
    sync_status: SyncStatus
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ── CPT ──────────────────────────────────────────────────────────────────────

class LecturaCPTManual(BaseModel):
    """Una lectura CPT ingresada manualmente."""
    profundidad: float
    qc: float  # Resistencia de punta (MPa)
    fs: float  # Fricción lateral (kPa)

    @field_validator("profundidad")
    @classmethod
    def validar_profundidad(cls, v: float) -> float:
        if v < 0:
            raise ValueError("La profundidad no puede ser negativa")
        return v

    @field_validator("qc")
    @classmethod
    def validar_qc(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("qc debe ser mayor a 0")
        return v

    @field_validator("fs")
    @classmethod
    def validar_fs(cls, v: float) -> float:
        if v < 0:
            raise ValueError("fs no puede ser negativo")
        return v


class EnsayoCPTCreate(BaseModel):
    """Ingreso manual de lecturas CPT."""
    sondeo_id: uuid.UUID
    device_id: str
    lecturas: list[LecturaCPTManual]

    @field_validator("lecturas")
    @classmethod
    def validar_lecturas(cls, v: list) -> list:
        if not v:
            raise ValueError("Debe incluir al menos una lectura")
        return v


class EnsayoCPTOut(BaseModel):
    id: uuid.UUID
    sondeo_id: uuid.UUID
    profundidad: float
    qc: float
    fs: float
    rf: float | None
    origen: str
    device_id: str
    sync_status: SyncStatus
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class FilaCSVError(BaseModel):
    """Detalle de una fila con error en la importación CSV (HU-09)."""
    fila: int
    contenido: str
    error: str


class ImportacionCSVResult(BaseModel):
    """Resultado de la importación de un archivo CSV de CPT."""
    sondeo_id: uuid.UUID
    lecturas_importadas: int
    lecturas_con_error: int
    errores: list[FilaCSVError]
    lecturas: list[EnsayoCPTOut]