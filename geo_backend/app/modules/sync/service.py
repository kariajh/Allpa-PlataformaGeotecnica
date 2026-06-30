# app/modules/sync/service.py
import hashlib
import hmac
import json
import uuid
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.modules.auditoria.service import AuditoriaService
from app.modules.dispositivos.models import Dispositivo
from app.modules.ensayos.models import EnsayoSPT
from app.modules.estratigrafia.models import Estrato, Muestra
from app.modules.multimedia.models import Foto
from app.modules.proyectos.models import Proyecto
from app.modules.sondeos.models import Sondeo
from app.modules.sync.conflict_resolver import ConflictResolver
from app.modules.sync.geopack_service import GeopackService
from app.modules.sync.schemas import (
    GeopackImportResponse,
    RegistroDelta,
    ResultadoRegistro,
    SyncRequest,
    SyncResponse,
)
from app.shared.enums import SyncStatus, TipoAccionAuditoria

# Mapa de entidades a sus modelos SQLAlchemy
ENTIDAD_MODELO = {
    "proyecto": Proyecto,
    "sondeo": Sondeo,
    "ensayo_spt": EnsayoSPT,
    "estrato": Estrato,
    "muestra": Muestra,
    "foto": Foto,
}


class SyncService:
    def __init__(self, db: Session):
        self.db = db

    # ── Validaciones ──────────────────────────────────────────────────────────

    def _verificar_dispositivo(self, device_id: str) -> Dispositivo:
        """Verifica que el dispositivo esté registrado y activo (HU-02)."""
        dispositivo = self.db.execute(
            select(Dispositivo).where(Dispositivo.device_id == device_id)
        ).scalars().first()

        if dispositivo is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Dispositivo '{device_id}' no registrado. "
                       "Contactá al administrador para registrar el dispositivo.",
            )

        if not dispositivo.activo:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Dispositivo '{device_id}' revocado. "
                       "Sync rechazado (HU-02).",
            )

        return dispositivo

    def _verificar_firma(
        self,
        device_id: str,
        registros: list[RegistroDelta],
        firma_recibida: str,
    ) -> None:
        """
        Verifica la firma HMAC-SHA256 del payload (RN-07).
        La clave de firma es el SECRET_KEY del servidor combinado con device_id.
        """
        clave = f"{settings.SECRET_KEY}:{device_id}".encode("utf-8")
        payload_str = json.dumps(
            [r.model_dump(mode="json") for r in registros],
            default=str,
            sort_keys=True,
        ).encode("utf-8")

        firma_esperada = hmac.new(
            clave, payload_str, hashlib.sha256
        ).hexdigest()

        if not hmac.compare_digest(firma_esperada, firma_recibida):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Firma digital inválida — sincronización rechazada (RN-07).",
            )

    # ── Procesamiento de registros ────────────────────────────────────────────

    def _obtener_version_servidor(
        self, modelo, registro_id: uuid.UUID
    ) -> int | None:
        """Obtiene la versión del registro en el servidor, o None si no existe."""
        existente = self.db.get(modelo, registro_id)
        if existente is None:
            return None
        return getattr(existente, "version", 1)

    def _upsert_registro(
        self,
        modelo,
        registro_id: uuid.UUID,
        datos: dict[str, Any],
        version_cliente: int,
    ) -> str:
        """
        Realiza el upsert idempotente del registro (RN-06).
        Retorna "inserted" o "updated".
        """
        existente = self.db.get(modelo, registro_id)

        if existente is None:
            # INSERT: registro nuevo del campo
            datos_limpios = {
                k: v for k, v in datos.items()
                if k not in ("created_at", "updated_at")
            }
            datos_limpios["id"] = registro_id
            datos_limpios["sync_status"] = SyncStatus.SYNCED.value
            nuevo = modelo(**datos_limpios)
            self.db.add(nuevo)
            return "inserted"
        else:
            # UPDATE: solo si cliente tiene versión más nueva
            for campo, valor in datos.items():
                if campo not in ("id", "created_at"):
                    setattr(existente, campo, valor)
            existente.sync_status = SyncStatus.SYNCED.value
            return "updated"

    def _procesar_registro(
        self, registro: RegistroDelta
    ) -> ResultadoRegistro:
        """Procesa un registro individual del delta."""
        modelo = ENTIDAD_MODELO.get(registro.entidad)

        if modelo is None:
            return ResultadoRegistro(
                id=registro.id,
                entidad=registro.entidad,
                resultado="rechazado",
                detalle=f"Entidad desconocida: '{registro.entidad}'",
            )

        try:
            version_servidor = self._obtener_version_servidor(
                modelo, registro.id
            )
            resultado = ConflictResolver.resolver(
                id_registro=registro.id,
                entidad=registro.entidad,
                version_cliente=registro.version,
                version_servidor=version_servidor,
            )

            if resultado.resultado == "synced":
                self._upsert_registro(
                    modelo, registro.id, registro.datos, registro.version
                )

            return resultado

        except Exception as e:
            return ResultadoRegistro(
                id=registro.id,
                entidad=registro.entidad,
                resultado="rechazado",
                detalle=str(e),
            )

    # ── Endpoints públicos ────────────────────────────────────────────────────

    def sincronizar_delta(self, request: SyncRequest) -> SyncResponse:
        """
        Sincronización delta por red (WiFi/Starlink) (CU-02, RF-09).
        Idempotente: enviar el mismo registro N veces produce el mismo resultado (RN-06).
        """
        # Verificar dispositivo y firma
        dispositivo = self._verificar_dispositivo(request.device_id)
        self._verificar_firma(
            request.device_id, request.registros, request.firma
        )

        # Procesar cada registro del delta
        resultados: list[ResultadoRegistro] = []
        for registro in request.registros:
            resultado = self._procesar_registro(registro)
            resultados.append(resultado)

        # Registrar evento de sync en auditoría
        AuditoriaService.registrar(
            db=self.db,
            entidad="dispositivo",
            entidad_id=dispositivo.id,
            tipo_accion=TipoAccionAuditoria.SYNC,
            usuario=request.device_id,
            device_id=request.device_id,
            descripcion=(
                f"Delta sync: {len(request.registros)} registros enviados. "
                f"Synced: {sum(1 for r in resultados if r.resultado == 'synced')}, "
                f"Omitidos: {sum(1 for r in resultados if r.resultado == 'omitido')}, "
                f"Conflictos: {sum(1 for r in resultados if r.resultado == 'conflicto')}"
            ),
        )

        self.db.commit()

        return SyncResponse(
            device_id=request.device_id,
            procesados=len(resultados),
            synced=sum(1 for r in resultados if r.resultado == "synced"),
            omitidos=sum(1 for r in resultados if r.resultado == "omitido"),
            conflictos=sum(1 for r in resultados if r.resultado == "conflicto"),
            resultados=resultados,
        )

    def importar_geopack(
        self,
        device_id: str,
        archivo_bytes: bytes,
    ) -> GeopackImportResponse:
        """
        Importa un paquete .geopack desde USB/SD (CU-02, RF-09, RN-07).
        Rechaza el paquete completo si la firma digital es inválida.
        """
        dispositivo = self._verificar_dispositivo(device_id)

        # Desempaquetar y verificar firma (RN-07)
        try:
            payload = GeopackService.desempaquetar(device_id, archivo_bytes)
        except ValueError as e:
            # Firma inválida — registrar en auditoría y rechazar (RN-07)
            AuditoriaService.registrar(
                db=self.db,
                entidad="dispositivo",
                entidad_id=dispositivo.id,
                tipo_accion=TipoAccionAuditoria.GEOPACK,
                usuario=device_id,
                device_id=device_id,
                descripcion=f"Geopack RECHAZADO: {str(e)}",
            )
            self.db.commit()

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e),
            )

        # Procesar los registros del payload
        registros_raw = payload.get("registros", [])
        resultados: list[ResultadoRegistro] = []

        for r in registros_raw:
            registro = RegistroDelta(**r)
            resultado = self._procesar_registro(registro)
            resultados.append(resultado)

        # Registrar importación exitosa en auditoría
        AuditoriaService.registrar(
            db=self.db,
            entidad="dispositivo",
            entidad_id=dispositivo.id,
            tipo_accion=TipoAccionAuditoria.GEOPACK,
            usuario=device_id,
            device_id=device_id,
            descripcion=(
                f"Geopack importado: {len(registros_raw)} registros. "
                f"Synced: {sum(1 for r in resultados if r.resultado == 'synced')}"
            ),
        )

        self.db.commit()

        return GeopackImportResponse(
            device_id=device_id,
            registros_importados=len(registros_raw),
            synced=sum(1 for r in resultados if r.resultado == "synced"),
            omitidos=sum(1 for r in resultados if r.resultado == "omitido"),
            conflictos=sum(1 for r in resultados if r.resultado == "conflicto"),
        )