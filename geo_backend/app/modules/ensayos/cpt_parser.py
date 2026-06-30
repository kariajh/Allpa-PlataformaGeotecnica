# app/modules/ensayos/cpt_parser.py
"""
Parser de archivos CSV para importación de datos CPT (RF-04, HU-09).

Formato esperado del CSV:
    profundidad,qc,fs
    0.100,0.500,2.300
    0.200,0.750,3.100
    ...

Columnas:
    profundidad: Profundidad en metros (float > 0)
    qc: Resistencia de punta en MPa (float > 0)
    fs: Fricción lateral en kPa (float >= 0)

El parser es tolerante: procesa todas las filas válidas e informa
las erróneas sin abortar la importación completa (HU-09).
"""
import io
import csv
from dataclasses import dataclass


@dataclass
class LecturaCPTParsed:
    profundidad: float
    qc: float
    fs: float
    rf: float  # calculado: fs/qc×100


@dataclass
class ErrorFila:
    fila: int
    contenido: str
    error: str


@dataclass
class ResultadoParseo:
    lecturas: list[LecturaCPTParsed]
    errores: list[ErrorFila]


class CPTParser:
    """
    Parser de CSV para datos CPT con cálculo automático de Rf (HU-09).
    """

    COLUMNAS_REQUERIDAS = {"profundidad", "qc", "fs"}

    @classmethod
    def calcular_rf(cls, fs: float, qc: float) -> float:
    
        """
        Rf = (fs / qc) * 100 (%)
        """
        """
        fs en kPa, qc en MPa → convertir qc a kPa primero:
        """
        """
        qc_kPa = qc_MPa * 1000
        """
        """
        Rf = (fs_kPa / qc_kPa) * 100
        """
        """
        Ejemplo: fs=18 kPa, qc=1.2 MPa → Rf = 18/1200*100 = 1.5%
        """
   
        qc_kpa = qc * 1000
        if qc_kpa == 0:
            return 0.0
        return round((fs / qc_kpa) * 100, 3)

    @classmethod
    def parsear(cls, contenido_csv: str) -> ResultadoParseo:
        """
        Parsea el contenido de un archivo CSV y retorna lecturas válidas
        + lista de filas con error (HU-09: "Resalta filas con error de formato").
        """
        lecturas: list[LecturaCPTParsed] = []
        errores: list[ErrorFila] = []

        try:
            reader = csv.DictReader(io.StringIO(contenido_csv.strip()))
        except Exception as e:
            errores.append(ErrorFila(
                fila=0,
                contenido="",
                error=f"Error al leer el CSV: {str(e)}"
            ))
            return ResultadoParseo(lecturas=[], errores=errores)

        # Verificar que existan las columnas requeridas
        if reader.fieldnames is None:
            errores.append(ErrorFila(
                fila=0,
                contenido="",
                error="El archivo CSV está vacío o no tiene encabezado"
            ))
            return ResultadoParseo(lecturas=[], errores=errores)

        columnas_csv = {c.strip().lower() for c in reader.fieldnames if c}
        columnas_faltantes = cls.COLUMNAS_REQUERIDAS - columnas_csv
        if columnas_faltantes:
            errores.append(ErrorFila(
                fila=0,
                contenido=str(reader.fieldnames),
                error=f"Columnas faltantes: {', '.join(columnas_faltantes)}. "
                      f"Se requieren: profundidad, qc, fs"
            ))
            return ResultadoParseo(lecturas=[], errores=errores)

        # Procesar fila por fila
        for num_fila, fila in enumerate(reader, start=2):
            contenido_str = str(dict(fila))
            try:
                profundidad = float(fila.get("profundidad", "").strip())
                qc = float(fila.get("qc", "").strip())
                fs = float(fila.get("fs", "").strip())

                # Validaciones de negocio
                if profundidad < 0:
                    raise ValueError("profundidad no puede ser negativa")
                if qc <= 0:
                    raise ValueError("qc debe ser mayor a 0")
                if fs < 0:
                    raise ValueError("fs no puede ser negativo")

                rf = cls.calcular_rf(fs, qc)

                lecturas.append(LecturaCPTParsed(
                    profundidad=profundidad,
                    qc=qc,
                    fs=fs,
                    rf=rf,
                ))

            except (ValueError, KeyError, AttributeError) as e:
                errores.append(ErrorFila(
                    fila=num_fila,
                    contenido=contenido_str,
                    error=str(e),
                ))

        return ResultadoParseo(lecturas=lecturas, errores=errores)