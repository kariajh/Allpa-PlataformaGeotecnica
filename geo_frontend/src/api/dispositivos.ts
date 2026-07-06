import { apiClient } from './client'
import type { Dispositivo, DispositivoCreate } from '@/types'

export const dispositivosApi = {
  list: () => apiClient.get<Dispositivo[]>('/dispositivos').then((r) => r.data),

  create: (data: DispositivoCreate) =>
    apiClient.post<Dispositivo>('/dispositivos', data).then((r) => r.data),

  // DELETE lógico: el registro se conserva para auditoría, solo se marca
  // activo=false. El backend exige el motivo en el body del DELETE.
  revocar: (deviceId: string, motivo: string) =>
    apiClient
      .delete<Dispositivo>(`/dispositivos/${deviceId}`, { data: { motivo } })
      .then((r) => r.data),
}