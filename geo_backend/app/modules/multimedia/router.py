# app/modules/multimedia/router.py
import uuid

from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.multimedia.schemas import FotoOut
from app.modules.multimedia.service import MultimediaService

from pathlib import Path
from fastapi.responses import FileResponse
from PIL import Image as PILImage
import io
from app.core.config import settings

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

@router.get("/fotos/{foto_id}/imagen")
def obtener_imagen(foto_id: uuid.UUID, db: Session = Depends(get_db)):
    """
    Devuelve la imagen completa de una foto (RF-07).
    """
    from app.modules.multimedia.models import Foto
    foto = db.get(Foto, foto_id)
    if foto is None:
        raise HTTPException(status_code=404, detail="Foto no encontrada")

    ruta = settings.MEDIA_DIR / foto.ruta_archivo
    if not ruta.exists():
        raise HTTPException(
            status_code=404,
            detail="Archivo de imagen no encontrado en disco"
        )

    return FileResponse(
        path=str(ruta),
        media_type=foto.mime_type,
        filename=foto.nombre_archivo,
    )


@router.get("/fotos/{foto_id}/thumbnail")
def obtener_thumbnail(
    foto_id: uuid.UUID,
    ancho: int = 300,
    alto: int = 300,
    db: Session = Depends(get_db),
):
    """
    Devuelve una miniatura redimensionada de la foto.
    Parámetros opcionales: ancho y alto en píxeles (default 300x300).
    Útil para grillas de fotos en el frontend.
    """
    from app.modules.multimedia.models import Foto
    from fastapi.responses import StreamingResponse

    foto = db.get(Foto, foto_id)
    if foto is None:
        raise HTTPException(status_code=404, detail="Foto no encontrada")

    ruta = settings.MEDIA_DIR / foto.ruta_archivo
    if not ruta.exists():
        raise HTTPException(
            status_code=404,
            detail="Archivo de imagen no encontrado en disco"
        )

    # Generar thumbnail con Pillow (ya instalado como dependencia)
    img = PILImage.open(ruta)
    img.thumbnail((ancho, alto), PILImage.LANCZOS)

    buffer = io.BytesIO()
    # Guardar siempre como JPEG para thumbnails (menor tamaño)
    img_rgb = img.convert("RGB")
    img_rgb.save(buffer, format="JPEG", quality=80)
    buffer.seek(0)

    return StreamingResponse(
        content=buffer,
        media_type="image/jpeg",
        headers={
            "Cache-Control": "max-age=3600",  # cachear 1 hora en el browser
        },
    )


@router.get("/fotos/muestra/{muestra_id}", response_model=list[FotoOut])
def listar_fotos_muestra(muestra_id: uuid.UUID, db: Session = Depends(get_db)):
    """Lista todas las fotos asociadas a una muestra específica."""
    from sqlalchemy import select
    from app.modules.multimedia.models import Foto
    return list(
        db.execute(
            select(Foto)
            .where(Foto.muestra_id == muestra_id)
            .order_by(Foto.created_at)
        )
        .scalars()
        .all()
    )