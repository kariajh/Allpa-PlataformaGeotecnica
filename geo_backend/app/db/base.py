# app/db/base.py
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """
    Clase base declarativa de SQLAlchemy.
    Todos los modelos (Proyecto, Sondeo, EnsayoSPT, etc.) heredan de esta
    clase, junto con los mixins de app/shared/mixins.py.

    Ejemplo:
        class Proyecto(Base, UUIDPrimaryKeyMixin, TimestampMixin, SyncMetadataMixin):
            __tablename__ = "proyectos"
            ...
    """
    pass