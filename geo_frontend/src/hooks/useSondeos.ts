import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { sondeosApi } from '@/api/sondeos'
import { getDeviceId } from '@/lib/device'
import type { SondeoCreate } from '@/types'

const queryKey = (proyectoId: string | undefined) => ['sondeos', proyectoId]

export function useSondeosQuery(proyectoId: string | undefined) {
  return useQuery({
    queryKey: queryKey(proyectoId),
    queryFn: () => sondeosApi.list(proyectoId as string),
    // No dispara la query hasta que haya un proyecto elegido: /sondeos
    // exige proyecto_id como query param obligatorio.
    enabled: Boolean(proyectoId),
  })
}

export function useCreateSondeo(proyectoId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<SondeoCreate, 'device_id' | 'proyecto_id'>) =>
      sondeosApi.create({
        ...data,
        proyecto_id: proyectoId as string,
        device_id: getDeviceId(),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKey(proyectoId) }),
  })
}

export function useCerrarSondeo(proyectoId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, operador }: { id: string; operador: string }) =>
      sondeosApi.cerrar(id, { operador, device_id: getDeviceId() }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKey(proyectoId) }),
  })
}

export function useReabrirSondeo(proyectoId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, operador, motivo }: { id: string; operador: string; motivo: string }) =>
      sondeosApi.reabrir(id, { operador, device_id: getDeviceId(), motivo }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKey(proyectoId) }),
  })
}