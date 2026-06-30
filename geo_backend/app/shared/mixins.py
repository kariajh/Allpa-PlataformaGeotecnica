# app/shared/mixins.py
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column

from app.shared.enums import SyncStatus


class UUIDPrimaryKeyMixin:
    """
    PK de tipo UUID generado en el cliente (RN-10).
    Usamos sa.Uuid (SQLAlchemy 2.x) en lugar de PG_UUID (dialecto
    PostgreSQL específico) porque Alembic autogenerate puede serializar
    sa.Uuid correctamente sin imports de dialecto.
    """
    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )


class TimestampMixin:
    """
    Timestamps con server_default=func.now() — serializable por Alembic.
    """
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class SyncMetadataMixin:
    """
    Metadatos de sincronización. sync_status como String(20)
    en lugar de Enum nativo — más flexible para migraciones futuras.
    """
    device_id: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
    )
    sync_status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default=SyncStatus.PENDING.value,
        server_default=SyncStatus.PENDING.value,
    )


class VersionMixin:
    """Versión incremental para resolución de conflictos en sync."""
    version: Mapped[int] = mapped_column(
        Integer,
        default=1,
        server_default="1",
        nullable=False,
    )