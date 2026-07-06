import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { muestrasApi } from '@/api/muestras'
import { getDeviceId } from '@/lib/device'
import type { MuestraCreate } from '@/types'

const queryKey = (sondeoId: string | undefined) => ['muestras', sondeoId]

export function useMuestrasQuery(sondeoId: string | undefined) {
  return useQuery({
    queryKey: queryKey(sondeoId),
    queryFn: () => muestrasApi.list(sondeoId as string),
    enabled: Boolean(sondeoId),
  })
}

export function useCreateMuestra(sondeoId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<MuestraCreate, 'device_id' | 'sondeo_id'>) =>
      muestrasApi.create({ ...data, sondeo_id: sondeoId as string, device_id: getDeviceId() }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKey(sondeoId) }),
  })
}