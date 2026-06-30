# app/modules/estratigrafia/qr_service.py
import base64
import uuid
from io import BytesIO

import qrcode


class QRService:
    """
    Genera códigos QR para muestras geotécnicas (HU-12, RF-06).
    El contenido del QR incluye UUID + proyecto_id + código correlativo
    para garantizar trazabilidad desde campo hasta laboratorio.
    """

    @staticmethod
    def generar_contenido(
        muestra_id: uuid.UUID,
        proyecto_id: uuid.UUID,
        codigo: str,
    ) -> str:
        """Contenido que se codifica en el QR."""
        return f"GEOFIELD|{muestra_id}|{proyecto_id}|{codigo}"

    @staticmethod
    def generar_imagen_base64(contenido: str) -> str:
        """
        Genera el QR como imagen PNG en base64.
        El frontend lo puede mostrar directamente como <img src="data:image/png;base64,...">
        o enviarlo a una impresora de etiquetas.
        """
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=8,
            border=2,
        )
        qr.add_data(contenido)
        qr.make(fit=True)

        img = qr.make_image(fill_color="black", back_color="white")
        buffer = BytesIO()
        img.save(buffer, format="PNG")
        buffer.seek(0)

        return base64.b64encode(buffer.getvalue()).decode("utf-8")