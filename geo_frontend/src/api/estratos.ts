import { apiClient } from './client'
import type { Estrato, EstratoCreate } from '@/types'

export const estratosApi = {
  list: (sondeoId: string) =>
    apiClient.get<Estrato[]>(`/estratos/${sondeoId}`).then((r) => r.data),
  create: (data: EstratoCreate) =>
    apiClient.post<Estrato>('/estratos', data).then((r) => r.data),
}