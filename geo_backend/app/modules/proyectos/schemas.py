# app/modules/proyectos/schemas.py
import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict

from app.shared.enums import SyncStatus


class ProyectoBase(BaseModel):
    nombre: str
    cliente: str
    responsable: str
    ubicacion: str | None = None
    fecha_inicio: date | None = None


class ProyectoCreate(ProyectoBase):
    """Datos que el cliente (app de campo) envía para crear un proyecto."""

    device_id: str


class ProyectoUpdate(BaseModel):
    """Todos los campos opcionales: solo se actualiza lo que se envía."""

    nombre: str | None = None
    cliente: str | None = None
    responsable: str | None = None
    ubicacion: str | None = None
    fecha_inicio: date | None = None


class ProyectoOut(ProyectoBase):
    """Lo que la API devuelve al consultar un proyecto."""

    id: uuid.UUID
    device_id: str
    sync_status: SyncStatus
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)