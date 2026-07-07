import { useMutation, useQuery } from '@tanstack/react-query'
import { syncApi } from '@/api/sync'
import { getDeviceId } from '@/lib/device'
import { getHmacKey } from '@/lib/hmac-store'
import { firmarRegistros } from '@/lib/sync-signature'
import { db } from '@/db/schema'
import type { RegistroDelta } from '@/types'

// Ver caveat en el propio hook: hoy esto va a estar vacío casi siempre,
// porque ningún hook de creación (useProyectos, useSondeos, etc.) escribe
// todavía en esta tabla cuando falla por error de red.
export function usePendientesSync() {
  return useQuery({
    queryKey: ['sync', 'pendientes'],
    queryFn: () => db.outbox.filter((item) => !item.synced).toArray(),
    refetchInterval: 5000,
  })
}

export function useImportarGeopack() {
  return useMutation({
    mutationFn: (archivo: File) => syncApi.importarGeopack(getDeviceId(), archivo),
  })
}

// Lanza 'SIN_HMAC_KEY' si este dispositivo nunca se registró (o se
// registró en otro navegador/perfil, donde localStorage no tiene la
// clave). La página debe capturar ese caso puntual.
export function useSincronizarDelta() {
  return useMutation({
    mutationFn: async (registros: RegistroDelta[]) => {
      const deviceId = getDeviceId()
      const hmacKey = getHmacKey(deviceId)
      if (!hmacKey) throw new Error('SIN_HMAC_KEY')
      const firma = await firmarRegistros(hmacKey, registros)
      return syncApi.sincronizarDelta({ device_id: deviceId, firma, registros })
    },
  })
}