# app/modules/ensayos/models.py
import uuid
from decimal import Decimal

from sqlalchemy import Boolean, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.shared.mixins import (
    SyncMetadataMixin,
    TimestampMixin,
    UUIDPrimaryKeyMixin,
)


class EnsayoSPT(Base, UUIDPrimaryKeyMixin, TimestampMixin, SyncMetadataMixin):
    """
    Ensayo de Penetración Estándar (SPT) según ASTM D1586.
    Sección 5.2 del análisis funcional.

    n_campo y n60 son valores CALCULADOS en EnsayosService usando CalculoSPT,
    y se persisten para consulta rápida sin recalcular.
    Nunca deben recibirse como input del cliente (RN-03).
    """

    __tablename__ = "ensayos_spt"

    sondeo_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("sondeos.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    profundidad: Mapped[Decimal] = mapped_column(
        Numeric(6, 2), nullable=False
    )

    tipo_martillo: Mapped[str] = mapped_column(
        String(20), nullable=False
    )

    eficiencia_er: Mapped[Decimal] = mapped_column(
        Numeric(4, 2), nullable=False
    )

    diametro_mm: Mapped[int] = mapped_column(Integer, nullable=False)

    longitud_varillaje: Mapped[Decimal] = mapped_column(
        Numeric(5, 2), nullable=False
    )

    # Golpes por tramo
    golpes_t1: Mapped[int] = mapped_column(Integer, nullable=False)
    golpes_t2: Mapped[int | None] = mapped_column(Integer, nullable=True)
    golpes_t3: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Valores calculados (RN-03, RN-04)
    n_campo: Mapped[int | None] = mapped_column(Integer, nullable=True)
    n60: Mapped[Decimal | None] = mapped_column(Numeric(6, 2), nullable=True)
    rechazo: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )

    # Relación ORM
    sondeo: Mapped["Sondeo"] = relationship(  # type: ignore[name-defined]
        "Sondeo", back_populates="ensayos_spt"
    )

    def __repr__(self) -> str:
        return (
            f"<EnsayoSPT id={self.id} "
            f"prof={self.profundidad}m "
            f"n={self.n_campo} n60={self.n60} "
            f"rechazo={self.rechazo}>"
        )

class EnsayoCPT(Base, UUIDPrimaryKeyMixin, TimestampMixin, SyncMetadataMixin):
    """
    Lectura individual de Ensayo de Penetración de Cono (CPT) según ASTM D5778.
    Cada registro es una lectura a una profundidad específica.
    Rf = fs/qc×100 se calcula automáticamente (HU-09).

    Un sondeo CPT puede tener cientos de lecturas — una por cada
    centímetro de profundidad del equipo de campo.
    """

    __tablename__ = "ensayos_cpt"

    sondeo_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("sondeos.id", ondelete="RESTRICT"),
        nullable=False, index=True,
    )

    # Profundidad de la lectura (m)
    profundidad: Mapped[Decimal] = mapped_column(Numeric(6, 3), nullable=False)

    # Resistencia de punta (MPa) — qc
    qc: Mapped[Decimal] = mapped_column(Numeric(8, 3), nullable=False)

    # Fricción lateral (kPa) — fs
    fs: Mapped[Decimal] = mapped_column(Numeric(8, 3), nullable=False)

    # Relación de fricción (%) — Rf = fs/qc×100 (calculado, nunca input)
    rf: Mapped[Decimal | None] = mapped_column(Numeric(6, 3), nullable=True)

    # Indica si la lectura vino de importación CSV o ingreso manual
    origen: Mapped[str] = mapped_column(
        String(10), nullable=False, default="manual", server_default="manual"
    )  # "manual" | "csv"

    sondeo: Mapped["Sondeo"] = relationship(  # type: ignore[name-defined]
        "Sondeo", back_populates="ensayos_cpt"
    )

    def __repr__(self) -> str:
        return (
            f"<EnsayoCPT id={self.id} "
            f"prof={self.profundidad}m "
            f"qc={self.qc} fs={self.fs} rf={self.rf}>"
        )