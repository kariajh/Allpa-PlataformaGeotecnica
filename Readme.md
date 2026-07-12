# ALLPA
## Plataforma Geotecnica Integral
**Sistema de Gestión Geotécnica Offline-First**

Aplicación web progresiva (PWA) para captura y gestión de datos 
geotécnicos en zonas remotas sin conectividad a internet.

## Stack tecnológico
- **Backend**: FastAPI · SQLAlchemy · PostgreSQL + PostGIS · Python 3.12
- **Frontend**: React · TypeScript · Vite · TailwindCSS (PWA) *(en desarrollo)*

## Funcionalidades — Fase 1
- Gestión de proyectos y sondeos geotécnicos con coordenadas GPS
- Ensayos SPT con cálculo automático de N y N₆₀ (ASTM D1586)
- Perfil estratigráfico con validación geométrica de solapamiento
- Muestras con código correlativo automático y etiqueta QR
- Fotos con extracción automática de GPS desde metadatos EXIF
- Modelo de ownership: control de escritura por dispositivo de campo
- Sincronización offline-first (en desarrollo)

## Arquitectura