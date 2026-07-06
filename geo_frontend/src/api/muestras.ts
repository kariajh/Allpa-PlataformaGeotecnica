import { apiClient } from './client'
import type { Muestra, MuestraCreate } from '@/types'

export const muestrasApi = {
  list: (sondeoId: string) =>
    apiClient.get<Muestra[]>(`/muestras/${sondeoId}`).then((r) => r.data),
  create: (data: MuestraCreate) =>
    apiClient.post<Muestra>('/muestras', data).then((r) => r.data),
  qrImageUrl: (muestraId: string) =>
    `${apiClient.defaults.baseURL}/muestras/${muestraId}/qr`,
}