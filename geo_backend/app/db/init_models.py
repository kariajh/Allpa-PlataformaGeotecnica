# app/db/init_models.py
# Importar todos los modelos en orden para que SQLAlchemy
# pueda resolver todas las relaciones antes del primer request.
# Agregar aquí cada nuevo modelo que se cree.
from app.modules.proyectos.models import Proyecto  # noqa: F401
from app.modules.sondeos.models import Sondeo      # noqa: F401
from app.modules.ensayos.models import EnsayoSPT, EnsayoCPT    # noqa: F401
from app.modules.estratigrafia.models import Estrato, Muestra  # noqa: F401
from app.modules.multimedia.models import Foto                  # noqa: F401
from app.modules.auditoria.models import RegistroAuditoria     # noqa: F401
from app.modules.dispositivos.models import Dispositivo        # noqa: F401