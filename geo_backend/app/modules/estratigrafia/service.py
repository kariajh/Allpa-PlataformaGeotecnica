# app/modules/estratigrafia/service.py
import uuid

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.modules.estratigrafia.models import Estrato, Muestra
from app.modules.estratigrafia.qr_service import QRService
from app.modules.estratigrafia.schemas import EstratoCreate, MuestraCreate
from app.modules.sondeos.models import Sondeo
from app.shared.enums import EstadoSondeo


class EstratigrafiaService:
    def __init__(self, db: Session):
        self.db = db

    def _obtener_sondeo_validado(
        self, sondeo_id: uuid.UUID, device_id: str
    ) -> Sondeo:
        """Valida que el sondeo exista, esté abierto y pertenezca al dispositivo."""
        sondeo = self.db.get(Sondeo, sondeo_id)

        if sondeo is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sondeo no encontrado",
            )
        if sondeo.estado == EstadoSondeo.CERRADO.value:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="No se puede modificar un sondeo cerrado (RN-02).",
            )
        if sondeo.device_id != device_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Solo el dispositivo propietario puede modificar este sondeo (RN-01).",
            )
        return sondeo

    def _validar_solapamiento(
        self,
        sondeo_id: uuid.UUID,
        prof_tope: float,
        prof_base: float,
    ) -> None:
        """
        RN-05: dos estratos no pueden solaparse en profundidad.
        Condición de solapamiento: tope_nuevo < base_existente
                                   AND base_nuevo > tope_existente
        """
        conflicto = self.db.execute(
            select(Estrato).where(
                Estrato.sondeo_id == sondeo_id,
                Estrato.prof_tope < prof_base,
                Estrato.prof_base > prof_tope,
            )
        ).scalars().first()

        if conflicto:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    f"Solapamiento detectado con el estrato "
                    f"{float(conflicto.prof_tope)}m — {float(conflicto.prof_base)}m. "
                    f"Corregí el rango antes de guardar (RN-05)."
                ),
            )

    def _generar_codigo_muestra(self, sondeo: Sondeo) -> str:
        """
        Genera código correlativo automático: S01-M01, S01-M02...
        (HU-12: código S03-M01, S03-M02...)
        """
        count = self.db.execute(
            select(func.count(Muestra.id)).where(
                Muestra.sondeo_id == sondeo.id
            )
        ).scalar() or 0

        numero = count + 1
        return f"{sondeo.codigo}-M{numero:02d}"

    # ── Estratos ─────────────────────────────────────────────────────────────

    def listar_estratos(self, sondeo_id: uuid.UUID) -> list[Estrato]:
        return list(
            self.db.execute(
                select(Estrato)
                .where(Estrato.sondeo_id == sondeo_id)
                .order_by(Estrato.prof_tope)
            )
            .scalars()
            .all()
        )

    def crear_estrato(self, datos: EstratoCreate) -> Estrato:
        """Registra un estrato con validación geométrica (RN-05, CU-04)."""
        self._obtener_sondeo_validado(datos.sondeo_id, datos.device_id)
        self._validar_solapamiento(
            datos.sondeo_id, datos.prof_tope, datos.prof_base
        )

        estrato = Estrato(
            sondeo_id=datos.sondeo_id,
            device_id=datos.device_id,
            prof_tope=datos.prof_tope,
            prof_base=datos.prof_base,
            color=datos.color,
            textura=datos.textura.value,
            consistencia=datos.consistencia.value if datos.consistencia else None,
            humedad=datos.humedad.value if datos.humedad else None,
            descripcion_libre=datos.descripcion_libre,
        )

        self.db.add(estrato)
        self.db.commit()
        self.db.refresh(estrato)
        return estrato

    # ── Muestras ─────────────────────────────────────────────────────────────

    def listar_muestras(self, sondeo_id: uuid.UUID) -> list[Muestra]:
        return list(
            self.db.execute(
                select(Muestra)
                .where(Muestra.sondeo_id == sondeo_id)
                .order_by(Muestra.profundidad)
            )
            .scalars()
            .all()
        )

    def crear_muestra(self, datos: MuestraCreate) -> Muestra:
        """
        Registra muestra con código correlativo automático y QR (HU-12, RF-06).
        """
        sondeo = self._obtener_sondeo_validado(datos.sondeo_id, datos.device_id)

        codigo = self._generar_codigo_muestra(sondeo)
        qr_contenido = QRService.generar_contenido(
            muestra_id=uuid.uuid4(),
            proyecto_id=sondeo.proyecto_id,
            codigo=codigo,
        )

        muestra = Muestra(
            sondeo_id=datos.sondeo_id,
            device_id=datos.device_id,
            codigo=codigo,
            tipo=datos.tipo.value,
            profundidad=datos.profundidad,
            diametro_mm=datos.diametro_mm,
            recuperacion_pct=datos.recuperacion_pct,
            qr_code=qr_contenido,
        )

        self.db.add(muestra)
        self.db.commit()
        self.db.refresh(muestra)
        return muestra