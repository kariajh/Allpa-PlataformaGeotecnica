import { apiClient } from './client'
import type { Foto } from '@/types'

interface UploadFotoParams {
  sondeoId: string
  deviceId: string
  archivo: File
  muestraId?: string
  descripcion?: string
}

export const fotosApi = {
  list: (sondeoId: string) =>
    apiClient.get<Foto[]>(`/fotos/${sondeoId}`).then((r) => r.data),

  upload: ({ sondeoId, deviceId, archivo, muestraId, descripcion }: UploadFotoParams) => {
    const form = new FormData()
    form.append('sondeo_id', sondeoId)
    form.append('device_id', deviceId)
    if (muestraId) form.append('muestra_id', muestraId)
    if (descripcion) form.append('descripcion', descripcion)
    form.append('archivo', archivo)
    return apiClient
      .post<Foto>('/fotos', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((r) => r.data)
  },

  imageUrl: (fotoId: string) => `${apiClient.defaults.baseURL}/fotos/${fotoId}/imagen`,

  thumbnailUrl: (fotoId: string, ancho = 120, alto = 120) =>
    `${apiClient.defaults.baseURL}/fotos/${fotoId}/thumbnail?ancho=${ancho}&alto=${alto}`,
}