# app/modules/proyectos/service.py
import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.proyectos.models import Proyecto
from app.modules.proyectos.schemas import ProyectoCreate, ProyectoUpdate


class ProyectosService:
    def __init__(self, db: Session):
        self.db = db

    def listar(self) -> list[Proyecto]:
        return list(self.db.execute(select(Proyecto)).scalars().all())

    def obtener(self, proyecto_id: uuid.UUID) -> Proyecto | None:
        return self.db.get(Proyecto, proyecto_id)

    def crear(self, datos: ProyectoCreate) -> Proyecto:
        proyecto = Proyecto(**datos.model_dump())
        self.db.add(proyecto)
        self.db.commit()
        self.db.refresh(proyecto)
        return proyecto

    def actualizar(self, proyecto: Proyecto, datos: ProyectoUpdate) -> Proyecto:
        cambios = datos.model_dump(exclude_unset=True)
        for campo, valor in cambios.items():
            setattr(proyecto, campo, valor)
        self.db.commit()
        self.db.refresh(proyecto)
        return proyecto