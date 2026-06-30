# app/modules/multimedia/exif_service.py
from pathlib import Path


class ExifService:
    """
    Extrae coordenadas GPS de los metadatos EXIF de una imagen (RF-07).
    Convierte el formato DMS (grados, minutos, segundos) a decimal.
    """

    @staticmethod
    def _dms_a_decimal(
        grados: float,
        minutos: float,
        segundos: float,
        referencia: str,
    ) -> float:
        """
        Convierte coordenadas en formato DMS a grados decimales.
        Referencia 'S' o 'W' hace el valor negativo (sur/oeste).
        """
        decimal = grados + (minutos / 60.0) + (segundos / 3600.0)
        if referencia in ("S", "W"):
            decimal = -decimal
        return round(decimal, 7)

    @staticmethod
    def extraer_gps(ruta_imagen: Path) -> tuple[float | None, float | None]:
        """
        Extrae latitud y longitud GPS del EXIF de la imagen.
        Retorna (None, None) si la imagen no tiene datos GPS o no es válida.
        """
        try:
            from PIL import Image
            from PIL.ExifTags import GPSTAGS, TAGS

            img = Image.open(ruta_imagen)
            exif_raw = img._getexif()  # type: ignore[attr-defined]

            if not exif_raw:
                return None, None

            # Encontrar el bloque GPSInfo
            gps_info_raw = None
            for tag_id, valor in exif_raw.items():
                if TAGS.get(tag_id) == "GPSInfo":
                    gps_info_raw = valor
                    break

            if not gps_info_raw:
                return None, None

            # Convertir a dict legible
            gps = {
                GPSTAGS.get(k, k): v
                for k, v in gps_info_raw.items()
            }

            # Extraer componentes
            lat_dms = gps.get("GPSLatitude")
            lat_ref = gps.get("GPSLatitudeRef")
            lon_dms = gps.get("GPSLongitude")
            lon_ref = gps.get("GPSLongitudeRef")

            if not all([lat_dms, lat_ref, lon_dms, lon_ref]):
                return None, None

            # Convertir cada componente (pueden ser fracciones Pillow)
            def a_float(val) -> float:
                if hasattr(val, "numerator"):
                    return val.numerator / val.denominator
                return float(val)

            latitud = ExifService._dms_a_decimal(
                a_float(lat_dms[0]),
                a_float(lat_dms[1]),
                a_float(lat_dms[2]),
                lat_ref,
            )
            longitud = ExifService._dms_a_decimal(
                a_float(lon_dms[0]),
                a_float(lon_dms[1]),
                a_float(lon_dms[2]),
                lon_ref,
            )
            return latitud, longitud

        except Exception:
            # Si hay cualquier error (imagen corrupta, formato no soportado,
            # sin EXIF), simplemente retornamos None en lugar de fallar
            return None, None