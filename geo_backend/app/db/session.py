# app/db/session.py
from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings

# El "engine" administra el pool de conexiones a PostgreSQL.
# Se crea una sola vez, al importar este módulo.
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,  # verifica que la conexión esté viva antes de usarla
)

# Fábrica de sesiones. Cada request HTTP va a obtener su propia Session
# a través de la dependencia get_db().
SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
)


def get_db() -> Generator[Session, None, None]:
    """
    Dependency de FastAPI: provee una sesión de base de datos por request
    y garantiza que se cierre al finalizar, incluso si hubo una excepción.

    Uso en un router:
        @router.get("/proyectos")
        def listar_proyectos(db: Session = Depends(get_db)):
            return db.query(Proyecto).all()
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()