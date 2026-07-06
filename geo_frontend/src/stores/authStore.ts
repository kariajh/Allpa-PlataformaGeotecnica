import { create } from 'zustand'

// Preparado para cuando actives AUTH_ENABLED en el backend antes del
// demo. Hoy con VITE_AUTH_ENABLED=false, token queda en null y el resto
// de la app funciona como si la auth no existiera.
interface AuthState {
  token: string | null
  isAuthenticated: boolean
  login: (token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  isAuthenticated: false,
  login: (token) => set({ token, isAuthenticated: true }),
  logout: () => set({ token: null, isAuthenticated: false }),
}))
