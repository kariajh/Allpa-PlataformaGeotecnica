# app/modules/sondeos/router.py
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.sondeos.schemas import (
    SondeoCerrarRequest,
    SondeoCreate,
    SondeoOut,
    SondeoReabrirRequest,
)
from app.modules.sondeos.service import SondeosService

router = APIRouter()


@router.get("", response_model=list[SondeoOut])
def listar_sondeos(proyecto_id: uuid.UUID, db: Session = Depends(get_db)):
    """Lista todos los sondeos de un proyecto (GET /sondeos?proyecto_id=...)."""
    return SondeosService(db).listar_por_proyecto(proyecto_id)


@router.post("", response_model=SondeoOut, status_code=status.HTTP_201_CREATED)
def crear_sondeo(datos: SondeoCreate, db: Session = Depends(get_db)):
    """Crea un nuevo sondeo con coordenadas GPS (RF-02)."""
    return SondeosService(db).crear(datos)


@router.patch("/{sondeo_id}/cerrar", response_model=SondeoOut)
def cerrar_sondeo(
    sondeo_id: uuid.UUID,
    datos: SondeoCerrarRequest,
    db: Session = Depends(get_db),
):
    """Cierra y firma digitalmente un sondeo (CU-03)."""
    service = SondeosService(db)
    sondeo = service.obtener(sondeo_id)
    if sondeo is None:
        raise HTTPException(status_code=404, detail="Sondeo no encontrado")
    return service.cerrar(sondeo, datos)


@router.patch("/{sondeo_id}/reabrir", response_model=SondeoOut)
def reabrir_sondeo(
    sondeo_id: uuid.UUID,
    datos: SondeoReabrirRequest,
    db: Session = Depends(get_db),
):
    """Reabre un sondeo cerrado (RN-09). Requiere rol Admin."""
    service = SondeosService(db)
    sondeo = service.obtener(sondeo_id)
    if sondeo is None:
        raise HTTPException(status_code=404, detail="Sondeo no encontrado")
    return service.reabrir(sondeo, datos)