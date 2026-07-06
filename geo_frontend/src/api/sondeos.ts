import { apiClient } from './client'
import type {
  Sondeo,
  SondeoCreate,
  SondeoCerrarPayload,
  SondeoReabrirPayload,
} from '@/types'

// A diferencia de Proyectos, Sondeos no tiene un PATCH genérico de edición
// ni un DELETE documentado (confirmado en swagger, 2026-06-30). El ciclo
// de vida es: crear -> cerrar (firma digital) -> [reabrir, solo Admin].
// Por eso este módulo no usa createResource() y define sus propios
// métodos, alineados 1 a 1 con los endpoints reales.
export const sondeosApi = {
  // GET /sondeos requiere proyecto_id como query param obligatorio.
  list: (proyectoId: string) =>
    apiClient
      .get<Sondeo[]>('/sondeos', { params: { proyecto_id: proyectoId } })
      .then((r) => r.data),

  create: (data: SondeoCreate) =>
    apiClient.post<Sondeo>('/sondeos', data).then((r) => r.data),

  cerrar: (sondeoId: string, data: SondeoCerrarPayload) =>
    apiClient.patch<Sondeo>(`/sondeos/${sondeoId}/cerrar`, data).then((r) => r.data),

  // Requiere rol Admin en el backend (RN-09). Si el usuario no tiene el
  // rol, el backend debería devolver 403 — lo manejamos como cualquier
  // otro error de mutación hasta que tengamos auth con roles en el front.
  reabrir: (sondeoId: string, data: SondeoReabrirPayload) =>
    apiClient.patch<Sondeo>(`/sondeos/${sondeoId}/reabrir`, data).then((r) => r.data),
}