# app/modules/ensayos/router.py
import uuid

from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.ensayos.schemas import (
    EnsayoCPTCreate,
    EnsayoCPTOut,
    EnsayoSPTCreate,
    EnsayoSPTOut,
    ImportacionCSVResult,
)
from app.modules.ensayos.service import EnsayosService

router = APIRouter()

# ── SPT ──────────────────────────────────────────────────────────────────────

@router.get("/spt/{sondeo_id}", response_model=list[EnsayoSPTOut])
def listar_ensayos_spt(sondeo_id: uuid.UUID, db: Session = Depends(get_db)):
    """Lista ensayos SPT de un sondeo, ordenados por profundidad."""
    return EnsayosService(db).listar_spt_por_sondeo(sondeo_id)


@router.post("/spt", response_model=EnsayoSPTOut, status_code=status.HTTP_201_CREATED)
def crear_ensayo_spt(datos: EnsayoSPTCreate, db: Session = Depends(get_db)):
    """
    Registra un ensayo SPT con cálculo automático de N y N₆₀ (CU-01).
    Valida ownership del sondeo (RN-01) y estado abierto (RN-02).
    """
    return EnsayosService(db).crear_spt(datos)

# ── CPT ──────────────────────────────────────────────────────────────────────

@router.get("/cpt/{sondeo_id}", response_model=list[EnsayoCPTOut])
def listar_ensayos_cpt(sondeo_id: uuid.UUID, db: Session = Depends(get_db)):
    """Lista lecturas CPT de un sondeo, ordenadas por profundidad."""
    return EnsayosService(db).listar_cpt_por_sondeo(sondeo_id)


@router.post(
    "/cpt",
    response_model=list[EnsayoCPTOut],
    status_code=status.HTTP_201_CREATED,
)
def crear_ensayo_cpt_manual(
    datos: EnsayoCPTCreate, db: Session = Depends(get_db)
):
    """
    Ingreso manual de lecturas CPT.
    Calcula Rf = fs/qc×100 automáticamente para cada lectura.
    """
    return EnsayosService(db).crear_cpt_manual(datos)


@router.post(
    "/cpt/import",
    response_model=ImportacionCSVResult,
    status_code=status.HTTP_200_OK,
)
async def importar_cpt_csv(
    sondeo_id: uuid.UUID = Form(...),
    device_id: str = Form(...),
    archivo: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    Importa lecturas CPT desde archivo CSV del equipo de campo (RF-04, HU-09).
    Formato CSV requerido: profundidad,qc,fs
    Procesa filas válidas e informa las erróneas sin abortar la importación.
    """
    contenido = await archivo.read()

    # Detectar encoding — algunos equipos de campo exportan latin-1
    try:
        texto = contenido.decode("utf-8")
    except UnicodeDecodeError:
        texto = contenido.decode("latin-1")

    return EnsayosService(db).importar_cpt_csv(sondeo_id, device_id, texto)