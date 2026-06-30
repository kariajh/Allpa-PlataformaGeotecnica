# app/modules/auditoria/service.py
import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.auditoria.models import RegistroAuditoria
from app.modules.auditoria.schemas import RegistroAuditoriaCreate
from app.shared.enums import TipoAccionAuditoria


class AuditoriaService:
    """
    Servicio de auditoría inmutable (RN-08).

    IMPORTANTE: Este servicio NO tiene métodos de actualización ni borrado.
    La tabla es append-only por diseño — una vez registrado un evento,
    no puede ser modificado ni eliminado por ningún rol, incluido el admin.

    Uso desde otros services:
        AuditoriaService.registrar(
            db=db,
            entidad="sondeo",
            entidad_id=sondeo.id,
            tipo_accion=TipoAccionAuditoria.CIERRE,
            usuario="Karina",
            device_id="dispositivo-test-001",
            descripcion="Sondeo cerrado con firma digital",
        )
    """

    @staticmethod
    def registrar(
        db: Session,
        entidad: str,
        entidad_id: uuid.UUID,
        tipo_accion: TipoAccionAuditoria,
        usuario: str,
        device_id: str,
        descripcion: str | None = None,
    ) -> RegistroAuditoria:
        """
        Registra un evento de auditoría (INSERT únicamente).
        Nunca lanza excepciones — si falla el registro de auditoría,
        la operación principal no debe verse afectada.
        """
        evento = RegistroAuditoria(
            entidad=entidad,
            entidad_id=entidad_id,
            tipo_accion=tipo_accion.value,
            usuario=usuario,
            device_id=device_id,
            descripcion=descripcion,
        )
        db.add(evento)
        # No hacemos commit acá — el commit lo hace el service que nos llama,
        # así el evento de auditoría queda en la misma transacción que
        # el cambio que registra. Si el cambio falla, el evento no se guarda.
        return evento

    @staticmethod
    def listar_por_entidad(
        db: Session,
        entidad: str,
        entidad_id: uuid.UUID,
    ) -> list[RegistroAuditoria]:
        """
        Historial de cambios de un registro específico,
        ordenado cronológicamente (más antiguo primero).
        """
        return list(
            db.execute(
                select(RegistroAuditoria)
                .where(
                    RegistroAuditoria.entidad == entidad,
                    RegistroAuditoria.entidad_id == entidad_id,
                )
                .order_by(RegistroAuditoria.timestamp)
            )
            .scalars()
            .all()
        )

    @staticmethod
    def listar_recientes(
        db: Session,
        limite: int = 50,
    ) -> list[RegistroAuditoria]:
        """
        Últimos N eventos del sistema (más reciente primero).
        Útil para el panel de administración.
        """
        return list(
            db.execute(
                select(RegistroAuditoria)
                .order_by(RegistroAuditoria.timestamp.desc())
                .limit(limite)
            )
            .scalars()
            .all()
        )