import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fotosApi } from '@/api/fotos'
import { getDeviceId } from '@/lib/device'

const queryKey = (sondeoId: string | undefined) => ['fotos', sondeoId]

export function useFotosQuery(sondeoId: string | undefined) {
  return useQuery({
    queryKey: queryKey(sondeoId),
    queryFn: () => fotosApi.list(sondeoId as string),
    enabled: Boolean(sondeoId),
  })
}

export function useUploadFoto(sondeoId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: { archivo: File; muestraId?: string; descripcion?: string }) =>
      fotosApi.upload({ sondeoId: sondeoId as string, deviceId: getDeviceId(), ...params }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKey(sondeoId) }),
  })
}