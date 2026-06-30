# app/modules/sondeos/models.py
import uuid
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.shared.enums import EstadoSondeo, TipoSondeo
from app.shared.mixins import (
    SyncMetadataMixin,
    TimestampMixin,
    UUIDPrimaryKeyMixin,
    VersionMixin,  
)

if TYPE_CHECKING:
    from app.modules.proyectos.models import Proyecto
    from app.modules.ensayos.models import EnsayoSPT
    from app.modules.estratigrafia.models import Estrato, Muestra
    from app.modules.multimedia.models import Foto

class Sondeo(Base, UUIDPrimaryKeyMixin, TimestampMixin, SyncMetadataMixin, VersionMixin):
    """
    Sondeo geotécnico (sección 5.2 del análisis funcional).
    Un sondeo pertenece a un proyecto y es propietario de sus ensayos
    mientras esté en estado 'abierto' (RN-01, RN-02).
    """

    __tablename__ = "sondeos"

    # FK → Proyecto (convención: <tabla_referenciada>_id)
    proyecto_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("proyectos.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    codigo: Mapped[str] = mapped_column(String(30), nullable=False)

    # Tipo como String para compatibilidad con Alembic autogenerate
    tipo: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default=TipoSondeo.PERFORACION.value,
    )

    # Coordenadas GPS — Numeric evita pérdida de precisión de float (RF-02)
    latitud: Mapped[Decimal] = mapped_column(Numeric(10, 7), nullable=False)
    longitud: Mapped[Decimal] = mapped_column(Numeric(10, 7), nullable=False)
    cota: Mapped[Decimal | None] = mapped_column(Numeric(8, 2), nullable=True)
    profundidad_total: Mapped[Decimal | None] = mapped_column(
        Numeric(6, 2), nullable=True
    )

    # Estado y firma digital (CU-03, RN-02)
    estado: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default=EstadoSondeo.ABIERTO.value,
        server_default=EstadoSondeo.ABIERTO.value,
    )
    firma_digital: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relación ORM con Proyecto (lazy="select" es el default)
    proyecto: Mapped["Proyecto"] = relationship(  # type: ignore[name-defined]
        "Proyecto", back_populates="sondeos"
    )

    ensayos_spt: Mapped[list["EnsayoSPT"]] = relationship(
        "EnsayoSPT", back_populates="sondeo", cascade="all, delete-orphan"
    )

    estratos: Mapped[list["Estrato"]] = relationship(
        "Estrato", back_populates="sondeo", cascade="all, delete-orphan"
    )
    muestras: Mapped[list["Muestra"]] = relationship(
        "Muestra", back_populates="sondeo", cascade="all, delete-orphan"
    )

    fotos: Mapped[list["Foto"]] = relationship(
        "Foto", back_populates="sondeo", cascade="all, delete-orphan"
    )

    ensayos_cpt: Mapped[list["EnsayoCPT"]] = relationship(
        "EnsayoCPT", back_populates="sondeo", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Sondeo id={self.id} codigo={self.codigo!r} estado={self.estado}>"


