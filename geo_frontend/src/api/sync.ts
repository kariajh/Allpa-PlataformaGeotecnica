import { apiClient } from './client'
import type { SyncRequest, SyncResponse, GeopackImportResponse } from '@/types'

export const syncApi = {
  // PENDIENTE: SyncRequest.firma no se puede calcular todavía (no hay
  // endpoint para obtener la clave secreta del HMAC). El backend va a
  // rechazar esto hasta que se defina el esquema de firma.
  sincronizarDelta: (payload: SyncRequest) =>
    apiClient.post<SyncResponse>('/sync', payload).then((r) => r.data),

  // Funcional: la firma va embebida en el archivo .geopack, no acá.
  importarGeopack: (deviceId: string, archivo: File) => {
    const form = new FormData()
    form.append('device_id', deviceId)
    form.append('archivo', archivo)
    return apiClient
      .post<GeopackImportResponse>('/sync/geopack', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data)
  },
}
