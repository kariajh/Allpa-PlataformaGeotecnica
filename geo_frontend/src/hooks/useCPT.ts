import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { cptApi } from '@/api/cpt'
import { getDeviceId } from '@/lib/device'
import type { LecturaCPTCreate } from '@/types'

const queryKey = (sondeoId: string | undefined) => ['cpt', sondeoId]

export function useCPTQuery(sondeoId: string | undefined) {
  return useQuery({
    queryKey: queryKey(sondeoId),
    queryFn: () => cptApi.list(sondeoId as string),
    enabled: Boolean(sondeoId),
  })
}

export function useCreateCPTManual(sondeoId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (lecturas: LecturaCPTCreate[]) =>
      cptApi.createManual({
        sondeo_id: sondeoId as string,
        device_id: getDeviceId(),
        lecturas,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKey(sondeoId) }),
  })
}

export function useImportCPTCsv(sondeoId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (archivo: File) => cptApi.importCsv(sondeoId as string, getDeviceId(), archivo),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKey(sondeoId) }),
  })
}