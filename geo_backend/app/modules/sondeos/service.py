# app/modules/sondeos/service.py
import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.auditoria.service import AuditoriaService
from app.modules.sondeos.firma_service import FirmaService
from app.modules.sondeos.models import Sondeo
from app.modules.sondeos.schemas import (
    SondeoCerrarRequest,
    SondeoCreate,
    SondeoReabrirRequest,
)
from app.shared.enums import EstadoSondeo, TipoAccionAuditoria


class SondeosService:
    def __init__(self, db: Session):
        self.db = db

    def listar_por_proyecto(self, proyecto_id: uuid.UUID) -> list[Sondeo]:
        return list(
            self.db.execute(
                select(Sondeo).where(Sondeo.proyecto_id == proyecto_id)
            )
            .scalars()
            .all()
        )

    def obtener(self, sondeo_id: uuid.UUID) -> Sondeo | None:
        return self.db.get(Sondeo, sondeo_id)

    def crear(self, datos: SondeoCreate) -> Sondeo:
        sondeo = Sondeo(**datos.model_dump())
        self.db.add(sondeo)

        # Registrar evento de creación en auditoría
        self.db.flush()  # para que sondeo.id esté disponible
        AuditoriaService.registrar(
            db=self.db,
            entidad="sondeo",
            entidad_id=sondeo.id,
            tipo_accion=TipoAccionAuditoria.CREACION,
            usuario=datos.device_id,
            device_id=datos.device_id,
            descripcion=f"Sondeo {sondeo.codigo} creado en proyecto {sondeo.proyecto_id}",
        )

        self.db.commit()
        self.db.refresh(sondeo)
        return sondeo

    def cerrar(self, sondeo: Sondeo, datos: SondeoCerrarRequest) -> Sondeo:
        """
        Cierra el sondeo y aplica firma digital (CU-03, RN-02).
        Una vez cerrado, los datos de ensayo pasan a read-only.
        """
        if sondeo.estado == EstadoSondeo.CERRADO.value:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="El sondeo ya está cerrado.",
            )

        # Verificar ownership: solo el dispositivo propietario puede cerrar (RN-01)
        if sondeo.device_id != datos.device_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Solo el dispositivo propietario puede cerrar este sondeo.",
            )

        firma, timestamp = FirmaService.generar(
            sondeo_id=sondeo.id,
            device_id=datos.device_id,
            operador=datos.operador,
        )

        sondeo.estado = EstadoSondeo.CERRADO.value
        sondeo.firma_digital = firma
        sondeo.version += 1

        # Registrar evento de cierre en auditoría (RN-08)
        AuditoriaService.registrar(
            db=self.db,
            entidad="sondeo",
            entidad_id=sondeo.id,
            tipo_accion=TipoAccionAuditoria.CIERRE,
            usuario=datos.operador,
            device_id=datos.device_id,
            descripcion=f"Sondeo cerrado con firma: {firma[:16]}...",
        )

        self.db.commit()
        self.db.refresh(sondeo)
        return sondeo

    def reabrir(self, sondeo: Sondeo, datos: SondeoReabrirRequest) -> Sondeo:
        """
        Reabre un sondeo cerrado (RN-09).
        Requiere aprobación del responsable técnico y genera evento de auditoría.
        """
        if sondeo.estado == EstadoSondeo.ABIERTO.value:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="El sondeo ya está abierto.",
            )

        sondeo.estado = EstadoSondeo.ABIERTO.value
        sondeo.firma_digital = None
        sondeo.version += 1

        # Registrar evento de reapertura en auditoría (RN-09)
        AuditoriaService.registrar(
            db=self.db,
            entidad="sondeo",
            entidad_id=sondeo.id,
            tipo_accion=TipoAccionAuditoria.REAPERTURA,
            usuario=datos.operador,
            device_id=datos.device_id,
            descripcion=f"Motivo: {datos.motivo}",
        )

        self.db.commit()
        self.db.refresh(sondeo)
        return sondeo