import { useMutation, useQuery } from '@tanstack/react-query'
import { syncApi } from '@/api/sync'
import { getDeviceId } from '@/lib/device'
import { db } from '@/db/schema'
import type { RegistroDelta } from '@/types'

// Lee la cola local de pendientes (Dexie). OJO: hoy ningún hook de
// creación (useProyectos, useSondeos, etc.) todavía escribe en esta tabla
// cuando falla por error de red — quedó como TODO en cada uno desde el
// scaffold inicial. Hasta que se conecte esa parte, esto va a mostrar
// siempre 0 pendientes aunque haya cambios sin sincronizar.
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

// Estructura lista para cuando se defina el esquema de firma HMAC.
// Hoy envía firma: '' — el backend debería rechazarlo (RN-07).
export function useSincronizarDelta() {
  return useMutation({
    mutationFn: (registros: RegistroDelta[]) =>
      syncApi.sincronizarDelta({ device_id: getDeviceId(), firma: '', registros }),
  })
}