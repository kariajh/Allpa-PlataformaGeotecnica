# app/modules/dispositivos/models.py
import secrets
from datetime import datetime

from sqlalchemy import Boolean, DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.shared.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class Dispositivo(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """
    Dispositivo de campo autorizado para sincronizar (HU-02, RF-12).
    Solo dispositivos registrados y no revocados pueden enviar datos al servidor.
    """

    __tablename__ = "dispositivos"

    # Identificador único del hardware (generado en el dispositivo)
    device_id: Mapped[str] = mapped_column(
        String(64), nullable=False, unique=True, index=True
    )

    nombre: Mapped[str] = mapped_column(String(120), nullable=False)
    descripcion: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Propietario/responsable del dispositivo
    responsable: Mapped[str] = mapped_column(String(80), nullable=False)

    # Estado de autorización
    activo: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default="true"
    )

    # Fecha de revocación (si fue revocado)
    revocado_en: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    motivo_revocacion: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Último sync registrado (se actualiza en cada sincronización exitosa)
    ultimo_sync: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Clave HMAC única por dispositivo para firmar payloads de sync (RN-07)
    # Generada aleatoriamente al registrar — nunca se vuelve a mostrar
    hmac_key: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        default=lambda: secrets.token_hex(32),
    )


    def __repr__(self) -> str:
        estado = "activo" if self.activo else "revocado"
        return (
            f"<Dispositivo device_id={self.device_id!r} "
            f"nombre={self.nombre!r} {estado}>"
        )