import { apiClient } from './client'
import type { EnsayoSPT, EnsayoSPTCreate } from '@/types'

// Sin PATCH/PUT confirmado: el ensayo SPT es de solo lectura una vez
// creado. El backend calcula n_campo, n60, eficiencia_er y rechazo — el
// cliente nunca los envía (RN-03).
export const sptApi = {
  list: (sondeoId: string) =>
    apiClient.get<EnsayoSPT[]>(`/ensayos/spt/${sondeoId}`).then((r) => r.data),

  create: (data: EnsayoSPTCreate) =>
    apiClient.post<EnsayoSPT>('/ensayos/spt', data).then((r) => r.data),
}