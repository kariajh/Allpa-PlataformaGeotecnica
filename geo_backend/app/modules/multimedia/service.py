# app/modules/multimedia/service.py
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.modules.multimedia.exif_service import ExifService
from app.modules.multimedia.models import Foto
from app.modules.sondeos.models import Sondeo
from app.shared.enums import EstadoSondeo

# Tipos MIME permitidos
MIME_PERMITIDOS = {"image/jpeg", "image/png", "image/heic", "image/webp"}
TAMANIO_MAX_MB = 20


class MultimediaService:
    def __init__(self, db: Session):
        self.db = db

    def _obtener_sondeo_validado(
        self, sondeo_id: uuid.UUID, device_id: str
    ) -> Sondeo:
        sondeo = self.db.get(Sondeo, sondeo_id)
        if sondeo is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sondeo no encontrado",
            )
        if sondeo.estado == EstadoSondeo.CERRADO.value:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="No se pueden agregar fotos a un sondeo cerrado (RN-02).",
            )
        if sondeo.device_id != device_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Solo el dispositivo propietario puede agregar fotos (RN-01).",
            )
        return sondeo

    def listar_por_sondeo(self, sondeo_id: uuid.UUID) -> list[Foto]:
        return list(
            self.db.execute(
                select(Foto)
                .where(Foto.sondeo_id == sondeo_id)
                .order_by(Foto.created_at)
            )
            .scalars()
            .all()
        )

    async def subir_foto(
        self,
        sondeo_id: uuid.UUID,
        device_id: str,
        archivo: UploadFile,
        muestra_id: uuid.UUID | None = None,
        descripcion: str | None = None,
    ) -> Foto:
        """
        Guarda la foto en disco, extrae GPS del EXIF y registra en la BD (RF-07).
        """
        # Validar sondeo y ownership
        self._obtener_sondeo_validado(sondeo_id, device_id)

        # Validar tipo MIME
        if archivo.content_type not in MIME_PERMITIDOS:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail=f"Tipo de archivo no permitido: {archivo.content_type}. "
                       f"Se aceptan: {', '.join(MIME_PERMITIDOS)}",
            )

        # Leer contenido y validar tamaño
        contenido = await archivo.read()
        tamanio = len(contenido)

        if tamanio > TAMANIO_MAX_MB * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"La imagen supera el límite de {TAMANIO_MAX_MB} MB.",
            )

        # Generar nombre único para el archivo
        foto_id = uuid.uuid4()
        extension = Path(archivo.filename or "foto.jpg").suffix.lower()
        nombre_archivo = f"{foto_id}{extension}"
        ruta_relativa = f"{sondeo_id}/{nombre_archivo}"
        ruta_completa = settings.MEDIA_DIR / str(sondeo_id) / nombre_archivo

        # Crear carpeta del sondeo si no existe
        ruta_completa.parent.mkdir(parents=True, exist_ok=True)

        # Guardar archivo en disco
        ruta_completa.write_bytes(contenido)

        # Extraer GPS del EXIF (RF-07)
        latitud, longitud = ExifService.extraer_gps(ruta_completa)

        # Crear registro en BD
        foto = Foto(
            id=foto_id,
            sondeo_id=sondeo_id,
            muestra_id=muestra_id,
            device_id=device_id,
            nombre_archivo=nombre_archivo,
            ruta_archivo=ruta_relativa,
            mime_type=archivo.content_type,
            tamanio_bytes=tamanio,
            latitud_exif=latitud,
            longitud_exif=longitud,
            descripcion=descripcion,
        )

        self.db.add(foto)
        self.db.commit()
        self.db.refresh(foto)
        return foto