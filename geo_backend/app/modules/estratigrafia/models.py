# app/modules/estratigrafia/models.py
import uuid
from decimal import Decimal
from typing import TYPE_CHECKING 

from sqlalchemy import ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.shared.mixins import (
    SyncMetadataMixin,
    TimestampMixin,
    UUIDPrimaryKeyMixin,
)

if TYPE_CHECKING:
    from app.modules.multimedia.models import Foto

class Estrato(Base, UUIDPrimaryKeyMixin, TimestampMixin, SyncMetadataMixin):
    """
    Estrato geotécnico del perfil estratigráfico (sección 5.2).
    RN-05: dos estratos no pueden solaparse en profundidad.
    """

    __tablename__ = "estratos"

    sondeo_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("sondeos.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    prof_tope: Mapped[Decimal] = mapped_column(Numeric(6, 2), nullable=False)
    prof_base: Mapped[Decimal] = mapped_column(Numeric(6, 2), nullable=False)
    color: Mapped[str] = mapped_column(String(60), nullable=False)
    textura: Mapped[str] = mapped_column(String(20), nullable=False)
    consistencia: Mapped[str | None] = mapped_column(String(20), nullable=True)
    humedad: Mapped[str | None] = mapped_column(String(20), nullable=True)
    descripcion_libre: Mapped[str | None] = mapped_column(Text, nullable=True)

    sondeo: Mapped["Sondeo"] = relationship(  # type: ignore[name-defined]
        "Sondeo", back_populates="estratos"
    )

    def __repr__(self) -> str:
        return (
            f"<Estrato id={self.id} "
            f"{self.prof_tope}m-{self.prof_base}m "
            f"{self.textura}>"
        )


class Muestra(Base, UUIDPrimaryKeyMixin, TimestampMixin, SyncMetadataMixin):
    """
    Muestra geotécnica con código correlativo y QR (sección 5.2).
    HU-12: código automático S03-M01, S03-M02...
    """

    __tablename__ = "muestras"

    sondeo_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("sondeos.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    codigo: Mapped[str] = mapped_column(String(20), nullable=False)
    tipo: Mapped[str] = mapped_column(String(20), nullable=False)
    profundidad: Mapped[Decimal] = mapped_column(Numeric(6, 2), nullable=False)
    diametro_mm: Mapped[int | None] = mapped_column(nullable=True)
    recuperacion_pct: Mapped[Decimal | None] = mapped_column(
        Numeric(5, 2), nullable=True
    )
    # Contenido del QR: UUID + proyecto_id + codigo (HU-12)
    qr_code: Mapped[str] = mapped_column(Text, nullable=False)

    sondeo: Mapped["Sondeo"] = relationship(  # type: ignore[name-defined]
        "Sondeo", back_populates="muestras"
    )

    fotos: Mapped[list["Foto"]] = relationship(  # type: ignore[name-defined]
        "Foto", back_populates="muestra"
    )

    def __repr__(self) -> str:
        return f"<Muestra id={self.id} codigo={self.codigo!r} tipo={self.tipo}>"