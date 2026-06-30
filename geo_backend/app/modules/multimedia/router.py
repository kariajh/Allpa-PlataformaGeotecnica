# app/modules/multimedia/router.py
import uuid

from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.multimedia.schemas import FotoOut
from app.modules.multimedia.service import MultimediaService

router = APIRouter()


@router.get("/fotos/{sondeo_id}", response_model=list[FotoOut])
def listar_fotos(sondeo_id: uuid.UUID, db: Session = Depends(get_db)):
    """Lista todas las fotos asociadas a un sondeo."""
    return MultimediaService(db).listar_por_sondeo(sondeo_id)


@router.post("/fotos", response_model=FotoOut, status_code=status.HTTP_201_CREATED)
async def subir_foto(
    sondeo_id: uuid.UUID = Form(...),
    device_id: str = Form(...),
    muestra_id: uuid.UUID | None = Form(None),
    descripcion: str | None = Form(None),
    archivo: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    Sube una foto y la asocia al sondeo (y opcionalmente a una muestra).
    Extrae coordenadas GPS del EXIF automáticamente (RF-07).
    Acepta: JPEG, PNG, HEIC, WebP. Límite: 20 MB.
    """
    return await MultimediaService(db).subir_foto(
        sondeo_id=sondeo_id,
        device_id=device_id,
        archivo=archivo,
        muestra_id=muestra_id,
        descripcion=descripcion,
    )