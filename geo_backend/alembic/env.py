# alembic/env.py
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool

from alembic import context

# --- Imports del proyecto ---
from app.core.config import settings
from app.db.base import Base

# Importar TODOS los modelos acá para que Base.metadata los conozca.
# Ejemplo (cuando exista):
from app.modules.proyectos.models import Proyecto   #noqa: F401
from app.modules.sondeos.models import Sondeo  # noqa: F401

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Inyectamos la URL real desde nuestro settings (que lee .env),
# en vez de depender de la línea sqlalchemy.url de alembic.ini
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here for 'autogenerate' support

target_metadata = Base.metadata


# Tablas de sistema que NO queremos que Alembic gestione
# (las crea/administra la extensión PostGIS, no nuestros modelos)
TABLAS_IGNORADAS_POSTGIS = {"spatial_ref_sys"}


def include_object(object, name, type_, reflected, compare_to):
    if type_ == "table" and name in TABLAS_IGNORADAS_POSTGIS:
        return False
    return True


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        include_object=include_object,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            include_object=include_object,
        )

        with context.begin_transaction():
            context.run_migrations()