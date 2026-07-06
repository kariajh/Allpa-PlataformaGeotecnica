import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { estratosApi } from '@/api/estratos'
import { getDeviceId } from '@/lib/device'
import type { EstratoCreate } from '@/types'

const queryKey = (sondeoId: string | undefined) => ['estratos', sondeoId]

export function useEstratosQuery(sondeoId: string | undefined) {
  return useQuery({
    queryKey: queryKey(sondeoId),
    queryFn: () => estratosApi.list(sondeoId as string),
    enabled: Boolean(sondeoId),
  })
}

export function useCreateEstrato(sondeoId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<EstratoCreate, 'device_id' | 'sondeo_id'>) =>
      estratosApi.create({ ...data, sondeo_id: sondeoId as string, device_id: getDeviceId() }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKey(sondeoId) }),
  })
}

// El backend devuelve 409 si el rango prof_tope/prof_base se superpone
// con otro estrato (RN-05). Se distingue del resto de errores para dar
// un mensaje específico en el dialog.
export function isConflictoSolapamiento(error: unknown): boolean {
  return error instanceof AxiosError && error.response?.status === 409
}