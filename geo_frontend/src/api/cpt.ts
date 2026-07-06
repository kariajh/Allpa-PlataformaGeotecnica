import { apiClient } from './client'
import type { EnsayoCPT, EnsayoCPTCreate, ImportacionCSVResult } from '@/types'

// Sin PATCH/PUT: las lecturas CPT son de solo lectura una vez creadas.
export const cptApi = {
  list: (sondeoId: string) =>
    apiClient.get<EnsayoCPT[]>(`/ensayos/cpt/${sondeoId}`).then((r) => r.data),

  // Carga manual: un solo POST crea varias lecturas (lote) de una vez.
  createManual: (data: EnsayoCPTCreate) =>
    apiClient.post<EnsayoCPT[]>('/ensayos/cpt', data).then((r) => r.data),

  // Importación CSV (RF-04, HU-09): procesa filas válidas e informa las
  // erróneas sin abortar el resto del archivo.
  importCsv: (sondeoId: string, deviceId: string, archivo: File) => {
    const form = new FormData()
    form.append('sondeo_id', sondeoId)
    form.append('device_id', deviceId)
    form.append('archivo', archivo)
    return apiClient
      .post<ImportacionCSVResult>('/ensayos/cpt/import', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data)
  },
}