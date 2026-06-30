# app/modules/multimedia/schemas.py
import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.shared.enums import SyncStatus


class FotoOut(BaseModel):
    id: uuid.UUID
    sondeo_id: uuid.UUID
    muestra_id: uuid.UUID | None
    nombre_archivo: str
    mime_type: str
    tamanio_bytes: int
    latitud_exif: float | None
    longitud_exif: float | None
    descripcion: str | None
    device_id: str
    sync_status: SyncStatus
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)