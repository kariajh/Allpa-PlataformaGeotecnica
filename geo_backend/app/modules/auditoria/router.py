# app/modules/auditoria/router.py
import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.auditoria.schemas import RegistroAuditoriaOut
from app.modules.auditoria.service import AuditoriaService

router = APIRouter()


@router.get("/{entidad}/{entidad_id}", response_model=list[RegistroAuditoriaOut])
def historial_entidad(
    entidad: str,
    entidad_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    """
    Historial inmutable de cambios de un registro específico (HU-16).
    Ejemplos:
        GET /auditoria/sondeo/uuid-del-sondeo
        GET /auditoria/proyecto/uuid-del-proyecto
    """
    return AuditoriaService.listar_por_entidad(db, entidad, entidad_id)


@router.get("/recientes", response_model=list[RegistroAuditoriaOut])
def eventos_recientes(
    limite: int = 50,
    db: Session = Depends(get_db),
):
    """Últimos N eventos del sistema. Útil para el panel de administración."""
    return AuditoriaService.listar_recientes(db, limite)