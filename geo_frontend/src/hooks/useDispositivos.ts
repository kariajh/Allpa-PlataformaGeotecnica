import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { dispositivosApi } from '@/api/dispositivos'
import type { DispositivoCreate } from '@/types'

const QUERY_KEY = ['dispositivos']

export function useDispositivosQuery() {
  return useQuery({ queryKey: QUERY_KEY, queryFn: dispositivosApi.list })
}

export function useCreateDispositivo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: DispositivoCreate) => dispositivosApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function useRevocarDispositivo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ deviceId, motivo }: { deviceId: string; motivo: string }) =>
      dispositivosApi.revocar(deviceId, motivo),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}