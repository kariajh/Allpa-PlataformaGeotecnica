# app/modules/proyectos/models.py
from datetime import date
from typing import TYPE_CHECKING

from sqlalchemy import Date, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.shared.mixins import (
    SyncMetadataMixin,
    TimestampMixin,
    UUIDPrimaryKeyMixin,
)

if TYPE_CHECKING:
    from app.modules.sondeos.models import Sondeo


class Proyecto(Base, UUIDPrimaryKeyMixin, TimestampMixin, SyncMetadataMixin):
    """
    Proyecto geotécnico (sección 5.2 del análisis funcional).
    Entidad raíz: un proyecto agrupa todos los sondeos de una campaña.
    """

    __tablename__ = "proyectos"

    nombre: Mapped[str] = mapped_column(String(120), nullable=False)
    cliente: Mapped[str] = mapped_column(String(120), nullable=False)
    responsable: Mapped[str] = mapped_column(String(80), nullable=False)
    ubicacion: Mapped[str | None] = mapped_column(String(200), nullable=True)
    fecha_inicio: Mapped[date | None] = mapped_column(Date, nullable=True)

    #Relacion inversa: un proyecto tiene muchos sondeos (seccion 5.3)
    sondeos: Mapped[list["Sondeo"]]= relationship(
        "Sondeo", back_populates="proyecto", cascade="all, delete-orphan"
    )
    def __repr__(self) -> str:
        return f"<Proyecto id={self.id} nombre={self.nombre!r}>"