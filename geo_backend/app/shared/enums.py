# app/shared/enums.py
from enum import Enum


class TipoSondeo(str, Enum):
    PERFORACION = "perforacion"
    CALICATA = "calicata"
    CPT = "cpt"
    VANE_SHEAR = "vane_shear"


class EstadoSondeo(str, Enum):
    ABIERTO = "abierto"
    CERRADO = "cerrado"


class TipoMartillo(str, Enum):
    DONUT = "donut"
    SEGURIDAD = "seguridad"
    AUTOMATICO = "automatico"


class TipoMuestra(str, Enum):
    ALTERADA = "alterada"
    INALTERADA = "inalterada"
    BLOQUE = "bloque"
    SHELBY = "shelby"
    MAZIER = "mazier"


class TexturaEstrato(str, Enum):
    ARENA = "arena"
    LIMO = "limo"
    ARCILLA = "arcilla"
    GRAVA = "grava"
    ROCA = "roca"


class ConsistenciaEstrato(str, Enum):
    MUY_BLANDA = "muy_blanda"
    BLANDA = "blanda"
    MEDIA = "media"
    FIRME = "firme"
    DURA = "dura"


class HumedadEstrato(str, Enum):
    SECO = "seco"
    HUMEDO = "humedo"
    MUY_HUMEDO = "muy_humedo"
    SATURADO = "saturado"


class SyncStatus(str, Enum):
    PENDING = "pending"
    SYNCED = "synced"
    CONFLICT = "conflict"
    PARTIAL = "partial"


class TipoAccionAuditoria(str, Enum):
    CREACION = "creacion"
    MODIFICACION = "modificacion"
    CIERRE = "cierre"
    SYNC = "sync"
    GEOPACK = "geopack"
    REAPERTURA = "reapertura"


class RolUsuario(str, Enum):
    CAMPO = "campo"
    OFICINA = "oficina"
    ADMIN = "admin"


# --- Constantes de reglas de negocio (RN-03) ---
# Eficiencia del martillo según tipo, usada en CalculoSPT.calcular_n60()
EFICIENCIA_MARTILLO: dict[TipoMartillo, float] = {
    TipoMartillo.DONUT: 0.60,
    TipoMartillo.SEGURIDAD: 0.45,
    TipoMartillo.AUTOMATICO: 0.72,
}