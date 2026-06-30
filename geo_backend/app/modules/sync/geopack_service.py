# app/modules/sync/geopack_service.py
import gzip
import hashlib
import hmac
import json
import os

from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes

from app.core.config import settings


class GeopackService:
    """
    Gestiona el formato .geopack para transferencia offline sin internet
    via USB, pendrive o tarjeta SD (RF-09, RN-07).

    Formato binario del archivo:
        [HEADER 16 bytes] + [HMAC-SHA256 32 bytes] + [IV AES 16 bytes]
        + [DATOS cifrados con AES-256-CBC (JSON gzip)]

    Firma digital: HMAC-SHA256 del (IV + DATOS_CIFRADOS) con clave derivada.
    Rechazo si firma inválida: RN-07 — el evento se registra en auditoría.
    """

    HEADER = b"GEOFIELD_PACK_V1"  # 16 bytes — identificación del formato

    @classmethod
    def _derivar_clave(cls, device_id: str) -> bytes:
        """
        Deriva una clave AES-256 específica para el dispositivo.
        Usa PBKDF2-HMAC-SHA256 con el SECRET_KEY del servidor como sal.
        Cada dispositivo tiene su propia clave derivada.
        """
        return hashlib.pbkdf2_hmac(
            "sha256",
            device_id.encode("utf-8"),
            settings.SECRET_KEY.encode("utf-8"),
            iterations=100_000,
            dklen=32,  # 256 bits para AES-256
        )

    @classmethod
    def empaquetar(cls, device_id: str, payload: dict) -> bytes:
        """
        Genera un paquete .geopack desde un payload dict:
        1. Serializa a JSON
        2. Comprime con gzip
        3. Cifra con AES-256-CBC
        4. Firma con HMAC-SHA256
        5. Retorna bytes listos para guardar en USB/SD
        """
        clave = cls._derivar_clave(device_id)

        # Serializar y comprimir
        json_bytes = json.dumps(payload, default=str).encode("utf-8")
        datos_comprimidos = gzip.compress(json_bytes, compresslevel=6)

        # Cifrar con AES-256-CBC + padding PKCS7
        iv = os.urandom(16)
        bloque = 16
        padding = bloque - (len(datos_comprimidos) % bloque)
        datos_padded = datos_comprimidos + bytes([padding] * padding)

        cipher = Cipher(
            algorithms.AES(clave),
            modes.CBC(iv),
            backend=default_backend(),
        )
        datos_cifrados = (
            cipher.encryptor().update(datos_padded) +
            cipher.encryptor().finalize()
        )

        # Firma HMAC-SHA256 sobre (IV + DATOS_CIFRADOS)
        contenido_firmado = iv + datos_cifrados
        firma = hmac.new(
            clave, contenido_firmado, hashlib.sha256
        ).digest()  # 32 bytes

        return cls.HEADER + firma + contenido_firmado

    @classmethod
    def desempaquetar(cls, device_id: str, datos_raw: bytes) -> dict:
        """
        Valida y desempaqueta un archivo .geopack (RN-07).
        Lanza ValueError si la firma digital es inválida —
        el llamador debe registrar el intento en auditoría.
        """
        # Verificar tamaño mínimo: header(16) + firma(32) + iv(16) + 1 bloque(16)
        if len(datos_raw) < 80:
            raise ValueError("Archivo .geopack demasiado pequeño o corrupto")

        # Verificar header
        if datos_raw[:16] != cls.HEADER:
            raise ValueError(
                "Header inválido — el archivo no es un paquete GeoField"
            )

        clave = cls._derivar_clave(device_id)

        # Extraer componentes
        firma_recibida = datos_raw[16:48]       # 32 bytes
        contenido_firmado = datos_raw[48:]       # IV(16) + DATOS_CIFRADOS
        iv = contenido_firmado[:16]
        datos_cifrados = contenido_firmado[16:]

        # Verificar firma HMAC-SHA256 (RN-07)
        firma_esperada = hmac.new(
            clave, contenido_firmado, hashlib.sha256
        ).digest()

        if not hmac.compare_digest(firma_recibida, firma_esperada):
            raise ValueError(
                "Firma digital inválida — paquete rechazado (RN-07)"
            )

        # Descifrar AES-256-CBC
        cipher = Cipher(
            algorithms.AES(clave),
            modes.CBC(iv),
            backend=default_backend(),
        )
        datos_padded = (
            cipher.decryptor().update(datos_cifrados) +
            cipher.decryptor().finalize()
        )

        # Remover padding PKCS7
        padding = datos_padded[-1]
        datos_comprimidos = datos_padded[:-padding]

        # Descomprimir y deserializar
        json_bytes = gzip.decompress(datos_comprimidos)
        return json.loads(json_bytes.decode("utf-8"))