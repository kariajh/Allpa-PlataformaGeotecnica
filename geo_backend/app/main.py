# app/main.py
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.exceptions import register_exception_handlers

# IMPORTANTE: debe ser el primer import del proyecto
# Registra todos los modelos en el mapper de SQLAlchemy
import app.db.init_models  # noqa: F401


from app.modules.auth.router import router as auth_router
from app.modules.proyectos.router import router as proyectos_router
from app.modules.sondeos.router import router as sondeos_router
from app.modules.ensayos.router import router as ensayos_router
from app.modules.estratigrafia.router import router as estratigrafia_router
from app.modules.multimedia.router import router as multimedia_router
from app.modules.sync.router import router as sync_router
from app.modules.dispositivos.router import router as dispositivos_router
from app.modules.auditoria.router import router as auditoria_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


def create_app() -> FastAPI:
    app = FastAPI(
        title="GeoField API",
        description="Sistema de Gestión Geotécnica Offline-First — Fase 1",
        version="1.0.0",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    register_exception_handlers(app)

    app.include_router(auth_router, prefix="/auth", tags=["Autenticación"])
    app.include_router(proyectos_router, prefix="/proyectos", tags=["Proyectos"])
    app.include_router(sondeos_router, prefix="/sondeos", tags=["Sondeos"])
    app.include_router(ensayos_router, prefix="/ensayos", tags=["Ensayos"])
    app.include_router(estratigrafia_router, tags=["Estratigrafía y Muestras"])
    app.include_router(multimedia_router, tags=["Multimedia"])
    app.include_router(sync_router, prefix="/sync", tags=["Sincronización"])
    app.include_router(dispositivos_router, prefix="/dispositivos", tags=["Dispositivos"])
    app.include_router(auditoria_router, prefix="/auditoria", tags=["Auditoría"])

    @app.get("/health", tags=["Sistema"])
    def health_check():
        return {"status": "ok", "service": "geofield-api", "version": "1.0.0"}

    return app


app = create_app()