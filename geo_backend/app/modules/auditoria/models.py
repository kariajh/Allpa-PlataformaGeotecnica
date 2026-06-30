# app/modules/auditoria/models.py
import uuid
from datetime import datetime

from sqlalchemy import DateTime, String, Text, func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class RegistroAuditoria(Base):
    """
    Historial inmutable de cambios (RN-08, HU-16).
    Tabla append-only: ningún rol puede borrar o modificar eventos.
    No hereda SyncMetadataMixin ni TimestampMixin porque:
    - No necesita sync_status (es una tabla del servidor central)
    - updated_at no tiene sentido en una tabla inmutable
    - El timestamp es de solo inserción y no debe cambiar nunca
    """

    __tablename__ = "auditoria"

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    # Qué entidad fue afectada (sondeo, proyecto, ensayo_spt, etc.)
    entidad: Mapped[str] = mapped_column(String(50), nullable=False, index=True)

    # ID del registro afectado
    entidad_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), nullable=False, index=True
    )

    # Tipo de acción realizada
    tipo_accion: Mapped[str] = mapped_column(String(30), nullable=False)

    # Quién lo hizo
    usuario: Mapped[str] = mapped_column(String(80), nullable=False)
    device_id: Mapped[str] = mapped_column(String(64), nullable=False)

    # Detalle del cambio
    descripcion: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Timestamp de solo inserción — generado por el servidor (UTC)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        index=True,
    )

    def __repr__(self) -> str:
        return (
            f"<RegistroAuditoria "
            f"entidad={self.entidad!r} "
            f"accion={self.tipo_accion!r} "
            f"usuario={self.usuario!r}>"
        )