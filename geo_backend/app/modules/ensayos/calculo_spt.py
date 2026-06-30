# app/modules/ensayos/calculo_spt.py
from app.shared.enums import EFICIENCIA_MARTILLO, TipoMartillo


class CalculoSPT:
    """
    Motor de cálculo SPT según ASTM D1586.
    Aislado en su propia clase para poder testearlo unitariamente
    sin levantar la base de datos ni el servidor HTTP.
    """

    @staticmethod
    def es_rechazo(golpes_t1: int) -> bool:
        """
        RN-04: Si T1 ≥ 50 golpes, el ensayo se marca como RECHAZO.
        T2 y T3 quedan nulos y no se computan en N.
        """
        return golpes_t1 >= 50

    @staticmethod
    def calcular_n(
        golpes_t2: int | None,
        golpes_t3: int | None,
    ) -> int | None:
        """
        N de campo = T2 + T3.
        El tramo T1 es de asentamiento y no se computa (ASTM D1586).
        Retorna None si algún tramo es None (caso rechazo).
        """
        if golpes_t2 is None or golpes_t3 is None:
            return None
        return golpes_t2 + golpes_t3

    @staticmethod
    def calcular_n60(
        n_campo: int,
        tipo_martillo: TipoMartillo,
    ) -> float:
        """
        RN-03: N₆₀ = N × Er / 0.6
        Er depende del tipo de martillo:
            donut     = 0.60
            seguridad = 0.45
            automático = 0.72
        Nunca se almacena como input — siempre se recalcula.
        """
        er = EFICIENCIA_MARTILLO[tipo_martillo]
        return round(n_campo * er / 0.6, 2)

    @classmethod
    def procesar(
        cls,
        golpes_t1: int,
        golpes_t2: int | None,
        golpes_t3: int | None,
        tipo_martillo: TipoMartillo,
        eficiencia_er: float,
    ) -> dict:
        """
        Procesa un ensayo SPT completo y retorna todos los valores calculados.
        Este método es el punto de entrada principal desde EnsayosService.
        """
        rechazo = cls.es_rechazo(golpes_t1)

        if rechazo:
            return {
                "rechazo": True,
                "golpes_t2": None,
                "golpes_t3": None,
                "n_campo": None,
                "n60": None,
                "eficiencia_er": eficiencia_er,
            }

        n_campo = cls.calcular_n(golpes_t2, golpes_t3)
        n60 = cls.calcular_n60(n_campo, tipo_martillo) if n_campo is not None else None

        return {
            "rechazo": False,
            "golpes_t2": golpes_t2,
            "golpes_t3": golpes_t3,
            "n_campo": n_campo,
            "n60": n60,
            "eficiencia_er": eficiencia_er,
        }