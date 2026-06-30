# app/modules/ensayos/service.py
import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.ensayos.calculo_spt import CalculoSPT
from app.modules.ensayos.cpt_parser import CPTParser
from app.modules.ensayos.models import EnsayoCPT, EnsayoSPT
from app.modules.ensayos.schemas import (
    EnsayoCPTCreate,
    EnsayoSPTCreate,
    FilaCSVError,
    ImportacionCSVResult,
)
from app.modules.sondeos.models import Sondeo
from app.shared.enums import EFICIENCIA_MARTILLO, EstadoSondeo, TipoMartillo

class EnsayosService:
    def __init__(self, db: Session):
        self.db = db

    def _obtener_sondeo_validado(
        self, sondeo_id: uuid.UUID, device_id: str
    ) -> Sondeo:
        """
        Obtiene el sondeo y valida las reglas de negocio antes de
        permitir cualquier escritura de ensayo.
        """
        sondeo = self.db.get(Sondeo, sondeo_id)

        if sondeo is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sondeo no encontrado",
            )

        # RN-02: sondeo cerrado no acepta nuevos ensayos
        if sondeo.estado == EstadoSondeo.CERRADO.value:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="No se pueden agregar ensayos a un sondeo cerrado (RN-02).",
            )

        # RN-01: solo el dispositivo propietario puede escribir
        if sondeo.device_id != device_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Solo el dispositivo propietario puede registrar ensayos (RN-01).",
            )

        return sondeo
    
    # ── SPT ──────────────────────────────────────────────────────────────────

    def listar_spt_por_sondeo(self, sondeo_id: uuid.UUID) -> list[EnsayoSPT]:
        return list(
            self.db.execute(
                select(EnsayoSPT)
                .where(EnsayoSPT.sondeo_id == sondeo_id)
                .order_by(EnsayoSPT.profundidad)
            )
            .scalars()
            .all()
        )

    def crear_spt(self, datos: EnsayoSPTCreate) -> EnsayoSPT:
        """
        Registra un ensayo SPT con cálculo automático de N y N₆₀ (CU-01).
        """
        # Validar sondeo y ownership
        self._obtener_sondeo_validado(datos.sondeo_id, datos.device_id)

        # Obtener eficiencia según tipo de martillo (RN-03)
        tipo_martillo = TipoMartillo(datos.tipo_martillo.value)
        eficiencia_er = EFICIENCIA_MARTILLO[tipo_martillo]

        # Calcular N, N₆₀ y detectar rechazo (RN-03, RN-04)
        resultado = CalculoSPT.procesar(
            golpes_t1=datos.golpes_t1,
            golpes_t2=datos.golpes_t2,
            golpes_t3=datos.golpes_t3,
            tipo_martillo=tipo_martillo,
            eficiencia_er=eficiencia_er,
        )

        ensayo = EnsayoSPT(
            sondeo_id=datos.sondeo_id,
            device_id=datos.device_id,
            profundidad=datos.profundidad,
            tipo_martillo=datos.tipo_martillo.value,
            eficiencia_er=resultado["eficiencia_er"],
            diametro_mm=datos.diametro_mm,
            longitud_varillaje=datos.longitud_varillaje,
            golpes_t1=datos.golpes_t1,
            golpes_t2=resultado["golpes_t2"],
            golpes_t3=resultado["golpes_t3"],
            n_campo=resultado["n_campo"],
            n60=resultado["n60"],
            rechazo=resultado["rechazo"],
        )

        self.db.add(ensayo)
        self.db.commit()
        self.db.refresh(ensayo)
        return ensayo

      # ── CPT ──────────────────────────────────────────────────────────────────

    def listar_cpt_por_sondeo(self, sondeo_id: uuid.UUID) -> list[EnsayoCPT]:
        return list(
            self.db.execute(
                select(EnsayoCPT)
                .where(EnsayoCPT.sondeo_id == sondeo_id)
                .order_by(EnsayoCPT.profundidad)
            )
            .scalars()
            .all()
        )

    def crear_cpt_manual(self, datos: EnsayoCPTCreate) -> list[EnsayoCPT]:
        """Ingreso manual de lecturas CPT con cálculo automático de Rf."""
        self._obtener_sondeo_validado(datos.sondeo_id, datos.device_id)

        ensayos = []
        for lectura in datos.lecturas:
            rf = CPTParser.calcular_rf(lectura.fs, lectura.qc)
            ensayo = EnsayoCPT(
                sondeo_id=datos.sondeo_id,
                device_id=datos.device_id,
                profundidad=lectura.profundidad,
                qc=lectura.qc,
                fs=lectura.fs,
                rf=rf,
                origen="manual",
            )
            self.db.add(ensayo)
            ensayos.append(ensayo)

        self.db.commit()
        for e in ensayos:
            self.db.refresh(e)
        return ensayos

    def importar_cpt_csv(
        self,
        sondeo_id: uuid.UUID,
        device_id: str,
        contenido_csv: str,
    ) -> ImportacionCSVResult:
        """
        Importa lecturas CPT desde CSV del equipo de campo (RF-04, HU-09).
        Procesa todas las filas válidas e informa las erróneas sin abortar.
        """
        self._obtener_sondeo_validado(sondeo_id, device_id)

        resultado_parseo = CPTParser.parsear(contenido_csv)

        ensayos_creados = []
        for lectura in resultado_parseo.lecturas:
            ensayo = EnsayoCPT(
                sondeo_id=sondeo_id,
                device_id=device_id,
                profundidad=lectura.profundidad,
                qc=lectura.qc,
                fs=lectura.fs,
                rf=lectura.rf,
                origen="csv",
            )
            self.db.add(ensayo)
            ensayos_creados.append(ensayo)

        self.db.commit()
        for e in ensayos_creados:
            self.db.refresh(e)

        return ImportacionCSVResult(
            sondeo_id=sondeo_id,
            lecturas_importadas=len(ensayos_creados),
            lecturas_con_error=len(resultado_parseo.errores),
            errores=[
                FilaCSVError(
                    fila=e.fila,
                    contenido=e.contenido,
                    error=e.error,
                )
                for e in resultado_parseo.errores
            ],
            lecturas=ensayos_creados,
        )
