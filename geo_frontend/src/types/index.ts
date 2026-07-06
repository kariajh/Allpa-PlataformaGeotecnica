// Todos los tipos de este archivo están confirmados contra el openapi.json
// real del backend (compartido por el usuario, 2026-07-03), salvo donde se
// indique lo contrario.

export interface BaseEntity {
  id: string
  created_at: string
  updated_at: string
}

// SyncStatus es el mismo enum compartido por Proyecto, Sondeo, EnsayoSPT,
// EnsayoCPT, Estrato, Muestra y Foto — antes lo tenía duplicado/suelto en
// cada tipo, ahora es uno solo.
export const SYNC_STATUSES = ['pending', 'synced', 'conflict', 'partial'] as const
export type SyncStatus = (typeof SYNC_STATUSES)[number]
export const SYNC_STATUS_LABELS: Record<SyncStatus, string> = {
  pending: 'Pendiente',
  synced: 'Sincronizado',
  conflict: 'Conflicto',
  partial: 'Parcial',
}

// ---------------------------------------------------------------------
// Proyectos
// ---------------------------------------------------------------------

export interface Proyecto extends BaseEntity {
  nombre: string
  cliente: string
  responsable: string
  ubicacion?: string | null
  fecha_inicio?: string | null
  device_id: string
  sync_status: SyncStatus
}

export type ProyectoCreate = Omit<Proyecto, 'id' | 'created_at' | 'updated_at' | 'sync_status'>
export type ProyectoUpdate = Partial<Omit<ProyectoCreate, 'device_id'>>

// ---------------------------------------------------------------------
// Sondeos
// ---------------------------------------------------------------------
// Sin PATCH genérico de edición ni DELETE: crear -> cerrar (firma
// digital, CU-03) -> [reabrir, solo Admin, RN-09].

export const TIPOS_SONDEO = ['perforacion', 'calicata', 'cpt', 'vane_shear'] as const
export type TipoSondeo = (typeof TIPOS_SONDEO)[number]

export const ESTADOS_SONDEO = ['abierto', 'cerrado'] as const
export type EstadoSondeo = (typeof ESTADOS_SONDEO)[number]

export interface Sondeo extends BaseEntity {
  codigo: string
  tipo: TipoSondeo
  latitud: number
  longitud: number
  cota?: number | null
  profundidad_total?: number | null
  proyecto_id: string
  estado: EstadoSondeo
  firma_digital?: string | null
  device_id: string
  sync_status: SyncStatus
  // Usado para detección de conflictos en la sincronización delta.
  version: number
}

export interface SondeoCreate {
  codigo: string
  tipo: TipoSondeo
  latitud: number
  longitud: number
  cota?: number | null
  profundidad_total?: number | null
  proyecto_id: string
  device_id: string
}

export interface SondeoCerrarPayload {
  operador: string
  device_id: string
}

export interface SondeoReabrirPayload {
  operador: string
  device_id: string
  motivo: string
}

// ---------------------------------------------------------------------
// Ensayos SPT
// ---------------------------------------------------------------------
// Sin PATCH/PUT: inmutable una vez creado. n_campo, n60, rechazo y
// eficiencia_er los calcula el servidor (RN-03), no se envían al crear.

export const TIPOS_MARTILLO = ['donut', 'seguridad', 'automatico'] as const
export type TipoMartillo = (typeof TIPOS_MARTILLO)[number]

export interface EnsayoSPT extends BaseEntity {
  sondeo_id: string
  profundidad: number
  tipo_martillo: TipoMartillo
  eficiencia_er: number
  diametro_mm: number
  longitud_varillaje: number
  golpes_t1: number
  golpes_t2: number | null
  golpes_t3: number | null
  n_campo: number | null
  n60: number | null
  rechazo: boolean
  device_id: string
  sync_status: SyncStatus
}

export interface EnsayoSPTCreate {
  sondeo_id: string
  device_id: string
  profundidad: number
  tipo_martillo: TipoMartillo
  diametro_mm: number
  longitud_varillaje: number
  golpes_t1: number
  golpes_t2?: number | null
  golpes_t3?: number | null
}

// ---------------------------------------------------------------------
// Ensayos CPT
// ---------------------------------------------------------------------
// Sin PATCH/PUT. Rf se calcula server-side (Rf = fs/qc×100). "origen" es
// string libre (sin enum en el backend) — valores probables "manual"/"csv".

export interface EnsayoCPT extends BaseEntity {
  sondeo_id: string
  profundidad: number
  qc: number
  fs: number
  rf: number | null
  origen: string
  device_id: string
  sync_status: SyncStatus
}

export interface LecturaCPTCreate {
  profundidad: number
  qc: number
  fs: number
}

export interface EnsayoCPTCreate {
  sondeo_id: string
  device_id: string
  lecturas: LecturaCPTCreate[]
}

export interface ImportacionCSVError {
  fila: number
  contenido: string
  error: string
}

export interface ImportacionCSVResult {
  sondeo_id: string
  lecturas_importadas: number
  lecturas_con_error: number
  errores: ImportacionCSVError[]
  lecturas: EnsayoCPT[]
}

// ---------------------------------------------------------------------
// Estratos
// ---------------------------------------------------------------------
// POST /estratos valida solapamiento de profundidades (RN-05, CU-04):
// devuelve 409 si prof_tope/prof_base se superpone con otro estrato del
// mismo sondeo. Hay que manejar ese código de estado en el dialog.

export const TEXTURAS_ESTRATO = ['arena', 'limo', 'arcilla', 'grava', 'roca'] as const
export type TexturaEstrato = (typeof TEXTURAS_ESTRATO)[number]

export const CONSISTENCIAS_ESTRATO = ['muy_blanda', 'blanda', 'media', 'firme', 'dura'] as const
export type ConsistenciaEstrato = (typeof CONSISTENCIAS_ESTRATO)[number]

export const HUMEDADES_ESTRATO = ['seco', 'humedo', 'muy_humedo', 'saturado'] as const
export type HumedadEstrato = (typeof HUMEDADES_ESTRATO)[number]

export interface Estrato extends BaseEntity {
  sondeo_id: string
  prof_tope: number
  prof_base: number
  color: string
  textura: TexturaEstrato
  consistencia: ConsistenciaEstrato | null
  humedad: HumedadEstrato | null
  descripcion_libre: string | null
  device_id: string
  sync_status: SyncStatus
}

export interface EstratoCreate {
  sondeo_id: string
  device_id: string
  prof_tope: number
  prof_base: number
  color: string
  textura: TexturaEstrato
  consistencia?: ConsistenciaEstrato | null
  humedad?: HumedadEstrato | null
  descripcion_libre?: string | null
}

// ---------------------------------------------------------------------
// Muestras
// ---------------------------------------------------------------------
// codigo y qr_code los genera el servidor automáticamente (HU-12, RF-06).
// GET /muestras/{id}/qr devuelve la imagen PNG del QR para imprimir.

export const TIPOS_MUESTRA = ['alterada', 'inalterada', 'bloque', 'shelby', 'mazier'] as const
export type TipoMuestra = (typeof TIPOS_MUESTRA)[number]

export interface Muestra extends BaseEntity {
  sondeo_id: string
  codigo: string
  tipo: TipoMuestra
  profundidad: number
  diametro_mm: number | null
  recuperacion_pct: number | null
  qr_code: string
  device_id: string
  sync_status: SyncStatus
}

export interface MuestraCreate {
  sondeo_id: string
  device_id: string
  tipo: TipoMuestra
  profundidad: number
  diametro_mm?: number | null
  recuperacion_pct?: number | null
}

// ---------------------------------------------------------------------
// Multimedia (Fotos) — confirmado contra GET /fotos/{sondeo_id} y POST
// /fotos (multipart). SIN endpoint de descarga: no hay preview posible.
// ---------------------------------------------------------------------
 
export interface Foto extends BaseEntity {
  sondeo_id: string
  muestra_id: string | null
  nombre_archivo: string
  mime_type: string
  tamanio_bytes: number
  latitud_exif: number | null
  longitud_exif: number | null
  descripcion: string | null
  device_id: string
  sync_status: SyncStatus
}

// ---------------------------------------------------------------------
// Auditoría — pendiente de construir la pantalla
// ---------------------------------------------------------------------

export const TIPOS_ACCION_AUDITORIA = [
  'creacion',
  'modificacion',
  'cierre',
  'sync',
  'geopack',
  'reapertura',
] as const
export type TipoAccionAuditoria = (typeof TIPOS_ACCION_AUDITORIA)[number]

export interface RegistroAuditoria {
  id: string
  entidad: string
  entidad_id: string
  tipo_accion: TipoAccionAuditoria
  usuario: string
  device_id: string
  descripcion: string | null
  timestamp: string
}

// ---------------------------------------------------------------------
// Dispositivos — pendiente de construir la pantalla
// ---------------------------------------------------------------------

export interface Dispositivo extends BaseEntity {
  device_id: string
  nombre: string
  descripcion: string | null
  responsable: string
  activo: boolean
  revocado_en: string | null
  motivo_revocacion: string | null
  ultimo_sync: string | null
}

export interface DispositivoCreate {
  device_id: string
  nombre: string
  responsable: string
  descripcion?: string | null
}

export interface DispositivoRevocarRequest {
  motivo: string
}

// ---------------------------------------------------------------------
// Sincronización
// ---------------------------------------------------------------------
// POST /sync/geopack: la firma va embebida en el propio archivo .geopack,
// el frontend solo sube el archivo. Funcional sin ambigüedad.
//
// POST /sync (delta): SyncRequest exige "firma" (HMAC-SHA256 del payload,
// RN-07). PENDIENTE: no hay endpoint documentado para que el dispositivo
// obtenga la clave secreta de firma. Se deja la estructura lista pero
// firma viaja vacía hasta definir el esquema (decisión pendiente, 2026-07-04).
 
export interface RegistroDelta {
  entidad: string
  id: string
  version?: number
  timestamp_local: string
  datos: Record<string, unknown>
}
 
export interface SyncRequest {
  device_id: string
  firma: string
  registros: RegistroDelta[]
}
 
export interface ResultadoRegistro {
  id: string
  entidad: string
  resultado: string
  detalle?: string | null
}
 
export interface SyncResponse {
  device_id: string
  procesados: number
  synced: number
  omitidos: number
  conflictos: number
  resultados: ResultadoRegistro[]
}
 
export interface GeopackImportResponse {
  device_id: string
  registros_importados: number
  synced: number
  omitidos: number
  conflictos: number
}