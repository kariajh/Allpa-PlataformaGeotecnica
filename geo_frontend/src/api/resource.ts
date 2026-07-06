import { apiClient } from './client'

// Factory CRUD genérica. Cada uno de los 9 módulos del backend expone
// endpoints REST estándar, así que en vez de repetir get/post/put/delete
// archivo por archivo, los módulos "simples" (proyectos, sondeos, spt,
// cpt, estratigrafia, multimedia, auditoria, dispositivos) instancian
// esto con su propio endpoint. Sync es distinto (no es CRUD puro) y
// tiene su propio archivo.
export function createResource<T = unknown>(endpoint: string) {
  return {
    list: (params?: Record<string, unknown>) =>
      apiClient.get<T[]>(endpoint, { params }).then((r) => r.data),
    get: (id: string | number) =>
      apiClient.get<T>(`${endpoint}/${id}`).then((r) => r.data),
    create: (data: Partial<T>) =>
      apiClient.post<T>(endpoint, data).then((r) => r.data),
    // El backend usa PATCH (actualización parcial: solo se envía lo que
    // cambió), no PUT.
    update: (id: string | number, data: Partial<T>) =>
      apiClient.patch<T>(`${endpoint}/${id}`, data).then((r) => r.data),
    remove: (id: string | number) =>
      apiClient.delete(`${endpoint}/${id}`).then((r) => r.data),
  }
}