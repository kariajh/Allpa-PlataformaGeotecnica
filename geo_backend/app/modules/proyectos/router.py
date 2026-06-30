# app/modules/proyectos/router.py
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.proyectos.schemas import ProyectoCreate, ProyectoOut, ProyectoUpdate
from app.modules.proyectos.service import ProyectosService

router = APIRouter()


@router.get("", response_model=list[ProyectoOut])
def listar_proyectos(db: Session = Depends(get_db)):
    return ProyectosService(db).listar()


@router.post("", response_model=ProyectoOut, status_code=status.HTTP_201_CREATED)
def crear_proyecto(datos: ProyectoCreate, db: Session = Depends(get_db)):
    return ProyectosService(db).crear(datos)


@router.patch("/{proyecto_id}", response_model=ProyectoOut)
def actualizar_proyecto(
    proyecto_id: uuid.UUID,
    datos: ProyectoUpdate,
    db: Session = Depends(get_db),
):
    service = ProyectosService(db)
    proyecto = service.obtener(proyecto_id)
    if proyecto is None:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    return service.actualizar(proyecto, datos)