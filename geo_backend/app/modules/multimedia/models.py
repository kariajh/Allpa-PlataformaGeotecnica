# app/modules/multimedia/models.py
import uuid
from decimal import Decimal

from sqlalchemy import BigInteger, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.shared.mixins import (
    SyncMetadataMixin,
    TimestampMixin,
    UUIDPrimaryKeyMixin,
)


class Foto(Base, UUIDPrimaryKeyMixin, TimestampMixin, SyncMetadataMixin):
    """
    Foto asociada a un sondeo o muestra (RF-07, HU-13).
    Las coordenadas GPS se extraen automáticamente del EXIF de la imagen.
    """

    __tablename__ = "fotos"

    # Asociación principal — sondeo (obligatorio)
    sondeo_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("sondeos.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    # Asociación opcional — muestra
    muestra_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("muestras.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # Metadatos del archivo
    nombre_archivo: Mapped[str] = mapped_column(String(255), nullable=False)
    ruta_archivo: Mapped[str] = mapped_column(String(500), nullable=False)
    mime_type: Mapped[str] = mapped_column(String(50), nullable=False)
    tamanio_bytes: Mapped[int] = mapped_column(BigInteger, nullable=False)

    # GPS extraído del EXIF (RF-07)
    latitud_exif: Mapped[Decimal | None] = mapped_column(
        Numeric(10, 7), nullable=True
    )
    longitud_exif: Mapped[Decimal | None] = mapped_column(
        Numeric(10, 7), nullable=True
    )

    descripcion: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relaciones ORM
    sondeo: Mapped["Sondeo"] = relationship(  # type: ignore[name-defined]
        "Sondeo", back_populates="fotos"
    )
    muestra: Mapped["Muestra"] = relationship(  # type: ignore[name-defined]
        "Muestra", back_populates="fotos"
    )

    def __repr__(self) -> str:
        return (
            f"<Foto id={self.id} "
            f"archivo={self.nombre_archivo!r} "
            f"gps=({self.latitud_exif}, {self.longitud_exif})>"
        )