# app/modules/sondeos/firma_service.py
import hashlib
import uuid
from datetime import datetime, timezone


class FirmaService:
    """
    Genera y verifica la firma digital de cierre de un sondeo (CU-03).
    Algoritmo: SHA256(sondeo_id + timestamp_utc + device_id + operador)
    Esto garantiza trazabilidad: quién cerró, desde qué dispositivo y cuándo.
    """

    @staticmethod
    def generar(
        sondeo_id: uuid.UUID,
        device_id: str,
        operador: str,
        timestamp: datetime | None = None,
    ) -> tuple[str, datetime]:
        """
        Retorna la firma digital y el timestamp UTC usado para generarla.
        El timestamp se devuelve para que quede registrado en auditoría.
        """
        if timestamp is None:
            timestamp = datetime.now(timezone.utc)

        contenido = f"{sondeo_id}{timestamp.isoformat()}{device_id}{operador}"
        firma = hashlib.sha256(contenido.encode("utf-8")).hexdigest()
        return firma, timestamp

    @staticmethod
    def verificar(
        firma: str,
        sondeo_id: uuid.UUID,
        device_id: str,
        operador: str,
        timestamp: datetime,
    ) -> bool:
        """Verifica que una firma coincida con los datos provistos."""
        firma_esperada, _ = FirmaService.generar(
            sondeo_id, device_id, operador, timestamp
        )
        return firma == firma_esperada