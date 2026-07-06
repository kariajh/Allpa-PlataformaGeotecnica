import { useQuery } from '@tanstack/react-query'
import { auditoriaApi } from '@/api/auditoria'

export function useEventosRecientesQuery(limite: number) {
  return useQuery({
    queryKey: ['auditoria', 'recientes', limite],
    queryFn: () => auditoriaApi.recientes(limite),
  })
}

export function useHistorialEntidadQuery(entidad: string | undefined, entidadId: string | undefined) {
  return useQuery({
    queryKey: ['auditoria', 'historial', entidad, entidadId],
    queryFn: () => auditoriaApi.historialEntidad(entidad as string, entidadId as string),
    enabled: Boolean(entidad && entidadId),
  })
}