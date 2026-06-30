# app/modules/auditoria/schemas.py
import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.shared.enums import TipoAccionAuditoria


class RegistroAuditoriaCreate(BaseModel):
    """
    Schema interno para crear eventos de auditoría.
    No se expone como endpoint público — otros services lo usan
    directamente para registrar eventos.
    """
    entidad: str
    entidad_id: uuid.UUID
    tipo_accion: TipoAccionAuditoria
    usuario: str
    device_id: str
    descripcion: str | None = None


class RegistroAuditoriaOut(BaseModel):
    """Lo que la API devuelve al consultar el historial."""
    id: uuid.UUID
    entidad: str
    entidad_id: uuid.UUID
    tipo_accion: TipoAccionAuditoria
    usuario: str
    device_id: str
    descripcion: str | None
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)