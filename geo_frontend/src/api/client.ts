import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 15000,
})

// Listo para cuando actives AUTH_ENABLED en el backend: agrega el token
// automáticamente si existe. Mientras esté en false, authStore.token
// queda en null y este interceptor no hace nada.
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Distingue "no hay respuesta" (problema de red -> candidato a cola
// offline) de errores HTTP reales (4xx/5xx -> mostrar al usuario).
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      error.isNetworkError = true
    }
    return Promise.reject(error)
  }
)
