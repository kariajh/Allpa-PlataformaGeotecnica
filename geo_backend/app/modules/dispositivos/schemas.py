# app/modules/dispositivos/schemas.py
import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class DispositivoCreate(BaseModel):
    """Datos para registrar un nuevo dispositivo autorizado."""
    device_id: str
    nombre: str
    responsable: str
    descripcion: str | None = None


class DispositivoRevocarRequest(BaseModel):
    """Datos para revocar un dispositivo (DELETE lógico)."""
    motivo: str


class DispositivoOut(BaseModel):
    """Schema estándar — NO incluye hmac_key por seguridad."""
    id: uuid.UUID
    device_id: str
    nombre: str
    descripcion: str | None
    responsable: str
    activo: bool
    revocado_en: datetime | None
    motivo_revocacion: str | None
    ultimo_sync: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DispositivoRegistradoOut(DispositivoOut):
    """
    Schema especial devuelto SOLO al registrar un dispositivo por primera vez.
    El servidor nunca vuelve a mostrar hmac_key — si se pierde,
    hay que revocar el dispositivo y registrar uno nuevo.
    El frontend debe almacenar esta clave de forma segura (localStorage
    cifrado o Secure Storage del sistema operativo).
    """
    hmac_key: str