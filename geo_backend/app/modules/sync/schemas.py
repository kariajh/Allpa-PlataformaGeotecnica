# app/modules/sync/schemas.py
import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel


class RegistroDelta(BaseModel):
    """
    Un registro pendiente de sincronización desde el dispositivo de campo.
    El UUID fue generado localmente (RN-10) — el servidor nunca asigna IDs.
    """
    entidad: str  # "proyecto", "sondeo", "ensayo_spt", "estrato", "muestra"
    id: uuid.UUID
    version: int = 1
    timestamp_local: datetime
    datos: dict[str, Any]  # datos completos del registro


class SyncRequest(BaseModel):
    """
    Payload de sincronización delta enviado por el dispositivo (CU-02).
    firma: HMAC-SHA256 del payload para verificar integridad (RN-07).
    """
    device_id: str
    firma: str
    registros: list[RegistroDelta]


class ResultadoRegistro(BaseModel):
    id: uuid.UUID
    entidad: str
    # synced: insertado correctamente
    # omitido: ya existía con misma versión (idempotencia RN-06)
    # conflicto: versión del servidor más nueva
    # rechazado: error de validación
    resultado: str
    detalle: str | None = None


class SyncResponse(BaseModel):
    """Respuesta del servidor tras procesar el delta (CU-02)."""
    device_id: str
    procesados: int
    synced: int
    omitidos: int
    conflictos: int
    resultados: list[ResultadoRegistro]


class GeopackImportResponse(BaseModel):
    """Respuesta tras importar un paquete .geopack."""
    device_id: str
    registros_importados: int
    synced: int
    omitidos: int
    conflictos: int