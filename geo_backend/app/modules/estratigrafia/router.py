# app/modules/estratigrafia/router.py
import uuid

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.estratigrafia.qr_service import QRService
from app.modules.estratigrafia.schemas import (
    EstratoCreate,
    EstratoOut,
    MuestraCreate,
    MuestraOut,
)
from app.modules.estratigrafia.service import EstratigrafiaService

router = APIRouter()


# ── Estratos ──────────────────────────────────────────────────────────────────

@router.get("/estratos/{sondeo_id}", response_model=list[EstratoOut])
def listar_estratos(sondeo_id: uuid.UUID, db: Session = Depends(get_db)):
    """Obtiene el perfil estratigráfico completo de un sondeo."""
    return EstratigrafiaService(db).listar_estratos(sondeo_id)


@router.post(
    "/estratos",
    response_model=EstratoOut,
    status_code=status.HTTP_201_CREATED,
)
def crear_estrato(datos: EstratoCreate, db: Session = Depends(get_db)):
    """
    Registra un estrato con validación de solapamiento (RN-05, CU-04).
    Devuelve 409 si el rango prof_tope/prof_base se superpone con otro estrato.
    """
    return EstratigrafiaService(db).crear_estrato(datos)


# ── Muestras ──────────────────────────────────────────────────────────────────

@router.get("/muestras/{sondeo_id}", response_model=list[MuestraOut])
def listar_muestras(sondeo_id: uuid.UUID, db: Session = Depends(get_db)):
    """Lista todas las muestras de un sondeo."""
    return EstratigrafiaService(db).listar_muestras(sondeo_id)


@router.post(
    "/muestras",
    response_model=MuestraOut,
    status_code=status.HTTP_201_CREATED,
)
def crear_muestra(datos: MuestraCreate, db: Session = Depends(get_db)):
    """
    Registra muestra con código correlativo automático y QR (HU-12, RF-06).
    """
    return EstratigrafiaService(db).crear_muestra(datos)


@router.get("/muestras/{muestra_id}/qr")
def obtener_qr_imagen(muestra_id: uuid.UUID, db: Session = Depends(get_db)):
    """
    Devuelve la imagen PNG del QR de una muestra para imprimir la etiqueta.
    """
    from app.modules.estratigrafia.models import Muestra
    muestra = db.get(Muestra, muestra_id)
    if muestra is None:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Muestra no encontrada")

    imagen_b64 = QRService.generar_imagen_base64(muestra.qr_code)

    import base64
    return Response(
        content=base64.b64decode(imagen_b64),
        media_type="image/png",
        headers={
            "Content-Disposition": f'attachment; filename="qr_{muestra.codigo}.png"'
        },
    )