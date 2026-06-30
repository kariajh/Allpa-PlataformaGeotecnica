# app/modules/dispositivos/service.py
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.auditoria.service import AuditoriaService
from app.modules.dispositivos.models import Dispositivo
from app.modules.dispositivos.schemas import (
    DispositivoCreate,
    DispositivoRevocarRequest,
)
from app.shared.enums import TipoAccionAuditoria


class DispositivosService:
    def __init__(self, db: Session):
        self.db = db

    def listar(self) -> list[Dispositivo]:
        return list(
            self.db.execute(
                select(Dispositivo).order_by(Dispositivo.nombre)
            )
            .scalars()
            .all()
        )

    def obtener_por_device_id(self, device_id: str) -> Dispositivo | None:
        """Busca por device_id (el identificador del hardware, no el UUID interno)."""
        return self.db.execute(
            select(Dispositivo).where(Dispositivo.device_id == device_id)
        ).scalars().first()

    def registrar(self, datos: DispositivoCreate) -> Dispositivo:
        """
        Registra un nuevo dispositivo autorizado (HU-02).
        Si el device_id ya existe, devuelve 409 Conflict.
        """
        existente = self.obtener_por_device_id(datos.device_id)
        if existente:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"El device_id '{datos.device_id}' ya está registrado.",
            )

        dispositivo = Dispositivo(**datos.model_dump())
        self.db.add(dispositivo)
        self.db.flush()

        AuditoriaService.registrar(
            db=self.db,
            entidad="dispositivo",
            entidad_id=dispositivo.id,
            tipo_accion=TipoAccionAuditoria.CREACION,
            usuario="admin",
            device_id=datos.device_id,
            descripcion=f"Dispositivo '{datos.nombre}' registrado para {datos.responsable}",
        )

        self.db.commit()
        self.db.refresh(dispositivo)
        return dispositivo

    def revocar(
        self,
        device_id: str,
        datos: DispositivoRevocarRequest,
    ) -> Dispositivo:
        """
        Revoca el acceso de un dispositivo (HU-02: 'Dispositivo revocado: sync rechazado').
        Es un DELETE lógico — el registro se mantiene para auditoría.
        """
        dispositivo = self.obtener_por_device_id(device_id)

        if dispositivo is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Dispositivo '{device_id}' no encontrado.",
            )

        if not dispositivo.activo:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"El dispositivo '{device_id}' ya está revocado.",
            )

        dispositivo.activo = False
        dispositivo.revocado_en = datetime.now(timezone.utc)
        dispositivo.motivo_revocacion = datos.motivo

        AuditoriaService.registrar(
            db=self.db,
            entidad="dispositivo",
            entidad_id=dispositivo.id,
            tipo_accion=TipoAccionAuditoria.MODIFICACION,
            usuario="admin",
            device_id=device_id,
            descripcion=f"Dispositivo revocado. Motivo: {datos.motivo}",
        )

        self.db.commit()
        self.db.refresh(dispositivo)
        return dispositivo