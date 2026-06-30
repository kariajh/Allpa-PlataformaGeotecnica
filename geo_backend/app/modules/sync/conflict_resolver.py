# app/modules/sync/conflict_resolver.py
from app.modules.sync.schemas import ResultadoRegistro


class ConflictResolver:
    """
    Resuelve conflictos entre versiones del cliente y del servidor.

    Estrategia "last-write-wins" con ownership:
    - Si el servidor no tiene el registro → INSERT (synced)
    - Si el servidor tiene el mismo registro con misma/mayor versión
      → omitir (idempotencia RN-06)
    - Si el cliente tiene versión mayor → UPDATE (synced)
    - Si el servidor tiene versión mayor → conflicto (el campo
      ya fue modificado desde otro canal)
    """

    @staticmethod
    def resolver(
        id_registro,
        entidad: str,
        version_cliente: int,
        version_servidor: int | None,
    ) -> ResultadoRegistro:
        """
        Determina qué hacer con un registro según las versiones.
        Retorna el ResultadoRegistro apropiado.
        """
        if version_servidor is None:
            # El servidor no tiene este registro → INSERT
            return ResultadoRegistro(
                id=id_registro,
                entidad=entidad,
                resultado="synced",
                detalle="Registro nuevo insertado",
            )

        if version_cliente <= version_servidor:
            # Mismo o viejo → omitir (idempotencia)
            return ResultadoRegistro(
                id=id_registro,
                entidad=entidad,
                resultado="omitido",
                detalle=f"Ya existe (server v{version_servidor} >= client v{version_cliente})",
            )

        # Cliente tiene versión más nueva → UPDATE
        return ResultadoRegistro(
            id=id_registro,
            entidad=entidad,
            resultado="synced",
            detalle=f"Actualizado (client v{version_cliente} > server v{version_servidor})",
        )