# app/modules/dispositivos/router.py
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.dispositivos.schemas import (
    DispositivoCreate,
    DispositivoOut,
    DispositivoRevocarRequest,
)
from app.modules.dispositivos.service import DispositivosService

router = APIRouter()


@router.get("", response_model=list[DispositivoOut])
def listar_dispositivos(db: Session = Depends(get_db)):
    """Lista todos los dispositivos registrados (activos y revocados)."""
    return DispositivosService(db).listar()


@router.post("", response_model=DispositivoOut, status_code=status.HTTP_201_CREATED)
def registrar_dispositivo(datos: DispositivoCreate, db: Session = Depends(get_db)):
    """
    Registra un nuevo dispositivo autorizado para sincronizar (HU-02).
    El primer acceso de un dispositivo requiere esta aprobación manual.
    """
    return DispositivosService(db).registrar(datos)


@router.delete("/{device_id}", response_model=DispositivoOut)
def revocar_dispositivo(
    device_id: str,
    datos: DispositivoRevocarRequest,
    db: Session = Depends(get_db),
):
    """
    Revoca el acceso de un dispositivo (HU-02: 'Dispositivo revocado: sync rechazado').
    Es un DELETE lógico — el registro se conserva para auditoría.
    """
    return DispositivosService(db).revocar(device_id, datos)