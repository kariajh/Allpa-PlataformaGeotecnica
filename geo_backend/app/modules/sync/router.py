# app/modules/sync/router.py
from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.sync.schemas import GeopackImportResponse, SyncRequest, SyncResponse
from app.modules.sync.service import SyncService

router = APIRouter()


@router.post("", response_model=SyncResponse)
def sincronizar_delta(request: SyncRequest, db: Session = Depends(get_db)):
    """
    Sincronización delta por red WiFi/Starlink (CU-02, RF-09).
    Idempotente: enviar el mismo registro N veces → mismo resultado (RN-06).
    Requiere dispositivo registrado y activo (HU-02).
    """
    return SyncService(db).sincronizar_delta(request)


@router.post(
    "/geopack",
    response_model=GeopackImportResponse,
    status_code=status.HTTP_200_OK,
)
async def importar_geopack(
    device_id: str = Form(...),
    archivo: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    Importa un paquete .geopack desde USB/SD (CU-02, RF-09).
    Rechaza completamente si la firma digital es inválida (RN-07).
    El intento de importación queda registrado en auditoría siempre.
    """
    contenido = await archivo.read()
    return SyncService(db).importar_geopack(device_id, contenido)