import { apiClient } from './client'
import type { RegistroAuditoria } from '@/types'

export const auditoriaApi = {
  recientes: (limite = 50) =>
    apiClient.get<RegistroAuditoria[]>('/auditoria/recientes', { params: { limite } }).then((r) => r.data),

  // "entidad" es string libre en el backend (ejemplos vistos: "sondeo",
  // "proyecto"). Sin enum confirmado para el resto — mejor apuesta.
  historialEntidad: (entidad: string, entidadId: string) =>
    apiClient.get<RegistroAuditoria[]>(`/auditoria/${entidad}/${entidadId}`).then((r) => r.data),
}