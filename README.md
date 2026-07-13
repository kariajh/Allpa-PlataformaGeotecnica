# ALLPA
## Plataforma Geotécnica Integral
**Sistema de Gestión Geotécnica Offline-First**

Aplicación web progresiva (PWA) para captura y gestión de datos
geotécnicos en zonas remotas sin conectividad a internet.

## Funcionalidades — Fase 1

- Gestión de proyectos y sondeos geotécnicos con coordenadas GPS
- Ensayos SPT con cálculo automático de N y N₆₀ (ASTM D1586)
- Perfil estratigráfico con validación geométrica de solapamiento
- Muestras con código correlativo automático y etiqueta QR
- Fotos con extracción automática de GPS desde metadatos EXIF
- Modelo de ownership: control de escritura por dispositivo de campo
- Sincronización offline-first (en desarrollo)

## Arquitectura

Monorepo con dos aplicaciones independientes que se comunican por API REST:

```
GeoApp/
├── geo_backend/    FastAPI + PostgreSQL/PostGIS
└── geo_frontend/   React PWA (Vite), offline-first
```

**Modelo offline-first:** el dispositivo de campo es dueño de los datos de un
sondeo mientras esté abierto — puede operar sin conexión y sincroniza al
recuperar señal. La sincronización usa bundles `.geopack`, cifrados con
AES-256-CBC y firmados con HMAC-SHA256 por dispositivo (clave generada y
almacenada en la tabla `dispositivos`, no en variables de entorno ni en
código — ver sección de seguridad más abajo).

En el frontend, mientras no hay conexión, las mutaciones (crear/editar/
eliminar) se encolan en una tabla `outbox` local (IndexedDB vía Dexie); un
worker de sincronización las envía cuando vuelve la red. Ese worker todavía
no está implementado — ver Roadmap.

> **Nota sobre cifrado en reposo:** el diseño original contemplaba SQLite +
> SQLCipher en el dispositivo. Al mover la captura de campo a una PWA de
> navegador, no hay acceso a SQLite nativo — el equivalente es IndexedDB, sin
> el cifrado automático que daba SQLCipher. Si esa garantía es necesaria,
> queda pendiente sumar `dexie-encrypted` o cifrar a mano antes de guardar.

## Stack tecnológico

**Backend**

| Pieza | Elegido |
|---|---|
| Framework | FastAPI (Python 3.12) |
| ORM / migraciones | SQLAlchemy + Alembic |
| Base de datos | PostgreSQL + PostGIS (geometría y coordenadas GPS) |
| Configuración | pydantic-settings, leyendo desde `.env` |
| Sincronización | Bundles `.geopack` — AES-256-CBC + HMAC-SHA256 por dispositivo |

**Frontend**

| Pieza | Elegido | Por qué |
|---|---|---|
| Build | Vite | Dev server rápido, estándar del resto de los proyectos |
| UI | Tailwind + shadcn/ui | Componentes accesibles sobre Radix |
| Routing | React Router v6 | Simple, suficiente para una app de módulos |
| Server state | TanStack Query | Cache, reintentos, `networkMode: offlineFirst` |
| Estado global liviano | Zustand | Sin boilerplate, para auth y estado de sync |
| Almacenamiento offline | Dexie (IndexedDB) | Reemplaza SQLite/SQLCipher del diseño original de campo |
| HTTP | Axios | Interceptores para token y detección de error de red |
| Formularios | React Hook Form + Zod | Validación de datos técnicos (SPT, CPT) |
| PWA | vite-plugin-pwa (Workbox) | Manifest + service worker, `NetworkFirst` para `/api/*` |

## Módulos (backend, 9 en total)

| Módulo | Qué gestiona |
|---|---|
| Proyectos | Unidad raíz jerárquica de todo lo demás |
| Sondeos | Perforaciones/calicatas con coordenadas GPS |
| SPT | Ensayo de penetración estándar, cálculo de N y N₆₀ |
| CPT | Ensayo de penetración de cono |
| Estratigrafía / Muestras | Perfil de suelo, validación de solapamiento, código QR |
| Multimedia | Fotos de campo, GPS extraído de EXIF |
| Auditoría | Trazabilidad de cambios |
| Dispositivos | Registro y clave HMAC/AES por dispositivo (ownership) |
| Sync | Empaquetado y validación de bundles `.geopack` |

## Estructura del repositorio

```
GeoApp/
├── geo_backend/
│   ├── alembic/
│   │   ├── versions/
│   │   └── env.py
│   ├── app/
│   │   ├── core/
│   │   │   └── config.py       Settings (pydantic-settings, lee .env)
│   │   ├── db/
│   │   │   └── base.py
│   │   └── modules/             uno por módulo listado arriba
│   ├── media/                    fotos subidas (no versionado)
│   ├── tests/
│   ├── .env.example
│   ├── alembic.ini
│   └── requirements.txt
├── geo_frontend/
│   ├── public/
│   │   └── icons/                íconos PWA / logo Allpa
│   ├── src/
│   │   ├── api/                   cliente axios, factory CRUD, sync
│   │   ├── components/
│   │   │   ├── layout/             AppLayout, Sidebar, indicador online/offline
│   │   │   └── ui/                  componentes shadcn
│   │   ├── db/
│   │   │   └── schema.ts            Dexie: tablas offline + outbox
│   │   ├── features/                 un folder por módulo (mismos 9 de arriba)
│   │   ├── lib/
│   │   ├── routes/index.tsx
│   │   ├── stores/                   authStore, syncStore
│   │   └── types/index.ts
│   ├── vite.config.ts                incluye vite-plugin-pwa + proxy a :8000
│   └── .env.example
└── README.md                          este archivo
```

## Setup local

### Backend

```bash
cd geo_backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/Mac

pip install -r requirements.txt

cp .env.example .env         # completar DATABASE_URL y SECRET_KEY reales
alembic upgrade head

uvicorn app.main:app --reload
```

API disponible en `http://localhost:8000`, documentación interactiva en
`http://localhost:8000/docs`.

### Frontend

```bash
cd geo_frontend
cp .env.example .env
npm install

# si es la primera vez que se inicializa shadcn/ui en este proyecto:
npx shadcn@latest init   # style "Default", color base "Slate"

npm run dev
```

El proxy de Vite ya redirige `/api` → `http://localhost:8000`; también podés
usar `VITE_API_URL` directamente, como está armado en `src/api/client.ts`.

## Capturas de pantalla

###Modulo Proyectos

<img width="1361" height="517" alt="image" src="https://github.com/user-attachments/assets/7c48fb5b-fcdf-4c7e-bd6d-f14b1abe103e" />

Editar
<img width="1305" height="596" alt="image" src="https://github.com/user-attachments/assets/6898b9d5-d2ae-478b-b4cd-607cc4871010" />

###Modulo Sondeos


<img width="1362" height="564" alt="image" src="https://github.com/user-attachments/assets/89f28c13-67ec-4ab6-815a-455380e88248" />

Nuevo Sondeo

<img width="1357" height="592" alt="image" src="https://github.com/user-attachments/assets/7e708fe4-861f-445c-a8b5-a7abf41d4b50" />

###Modulo SPT - Ensayo de Penetración Estándar

<img width="1360" height="609" alt="image" src="https://github.com/user-attachments/assets/369d1135-0263-4064-b5be-7c50a3f53e0f" />

Nuevo Ensayo SPT

<img width="1344" height="620" alt="image" src="https://github.com/user-attachments/assets/986ec963-2019-4977-86f7-32d3decc0335" />


## Seguridad

- Ningún secreto (`DATABASE_URL`, `SECRET_KEY`) tiene valor por default en
  `config.py` — si falta el `.env`, la app no arranca en vez de usar un
  valor hardcodeado.
- Las claves HMAC/AES de sincronización se generan por dispositivo y viven
  en la base de datos, nunca en archivos de configuración ni en código.
- `venv/`, `node_modules/`, `.env` y `media/` están excluidos del control de
  versiones — ver `.gitignore` en la raíz.

## Roadmap / Próximos pasos

1. Reemplazar los tipos placeholder de `src/types/index.ts` y los endpoints
   de `src/api/index.ts` por los reales, contra el OpenAPI del backend.
2. Activar autenticación (`AUTH_ENABLED`): `authStore.ts` y el interceptor
   de `client.ts` ya están preparados; falta la pantalla de login y el
   route guard.
3. Implementar el worker de sync que drena la tabla `outbox` de Dexie
   contra el backend cuando vuelve la conexión.
4. Decidir si se suma cifrado en reposo para IndexedDB (`dexie-encrypted`)
   dado que no hay equivalente automático a SQLCipher en el navegador.
