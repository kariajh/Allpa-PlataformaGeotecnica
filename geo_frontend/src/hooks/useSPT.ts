import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { sptApi } from '@/api/spt'
import { getDeviceId } from '@/lib/device'
import type { EnsayoSPTCreate } from '@/types'

const queryKey = (sondeoId: string | undefined) => ['spt', sondeoId]

export function useSPTQuery(sondeoId: string | undefined) {
  return useQuery({
    queryKey: queryKey(sondeoId),
    queryFn: () => sptApi.list(sondeoId as string),
    enabled: Boolean(sondeoId),
  })
}

export function useCreateSPT(sondeoId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<EnsayoSPTCreate, 'device_id' | 'sondeo_id'>) =>
      sptApi.create({
        ...data,
        sondeo_id: sondeoId as string,
        device_id: getDeviceId(),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKey(sondeoId) }),
  })
}