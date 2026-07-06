import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { proyectosApi } from '@/api'
import type { Proyecto } from '@/types'

const QUERY_KEY = ['proyectos']

export function useProyectosQuery() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => proyectosApi.list(),
  })
}

export function useCreateProyecto() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Proyecto>) => proyectosApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function useUpdateProyecto() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Proyecto> }) =>
      proyectosApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function useDeleteProyecto() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => proyectosApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

// TODO offline: si proyectosApi.create/update/remove falla por error de red
// (error.isNetworkError, ver src/api/client.ts), encolar en db.outbox en vez
// de solo mostrar el toast de error. Lo dejamos para cuando armemos el
// worker de sincronización.