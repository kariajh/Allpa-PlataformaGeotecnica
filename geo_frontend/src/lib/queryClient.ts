import { QueryClient } from '@tanstack/react-query'

// networkMode 'offlineFirst': si no hay red, React Query sirve el último
// dato cacheado en vez de tirar la query a error. Clave para el uso de
// campo de GeoField, donde la conexión es intermitente o nula.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      networkMode: 'offlineFirst',
      retry: 1,
      staleTime: 1000 * 60, // 1 min
      refetchOnWindowFocus: false,
    },
    mutations: {
      networkMode: 'offlineFirst',
    },
  },
})
