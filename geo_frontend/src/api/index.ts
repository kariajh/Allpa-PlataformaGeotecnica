import { createResource } from './resource'
import type {
  Proyecto,
} from '@/types'

// TODO: una vez que compartas el OpenAPI (localhost:8000/openapi.json
// o /docs) de cada módulo, ajustamos el path exacto y regeneramos los
// tipos en src/types con los nombres de campo reales del backend.
export const proyectosApi = createResource<Proyecto>('/proyectos')
// Sondeos y SPT tienen su propio módulo (no son CRUD estándar). Ver
// src/api/sondeos.ts y src/api/spt.ts
export { sondeosApi } from './sondeos'
export { sptApi } from './spt'
export { cptApi } from './cpt'
export { estratosApi } from './estratos'
export { muestrasApi } from './muestras'
export { fotosApi } from './fotos'
export { auditoriaApi } from './auditoria'
export { dispositivosApi } from './dispositivos'