import Dexie, { type Table } from 'dexie'

// Almacenamiento offline-first del lado del navegador con IndexedDB
// (vía Dexie). Reemplaza, en el contexto de una PWA web, al diseño
// original de SQLite/SQLCipher en el dispositivo de campo: la lógica
// de "capturar offline -> encolar -> sincronizar" se mantiene igual,
// cambia el motor de almacenamiento local.
//
// outbox: cola de mutaciones pendientes (crear/editar/eliminar) hechas
// sin conexión. syncStore + un worker de sync las van drenando contra
// el backend cuando vuelve la red.
export interface OutboxItem {
  id?: number
  resource: string
  method: 'POST' | 'PUT' | 'DELETE'
  endpoint: string
  payload?: unknown
  createdAt: number
  synced: boolean
}

export class GeoFieldDB extends Dexie {
  proyectos!: Table<Record<string, unknown>, string>
  sondeos!: Table<Record<string, unknown>, string>
  spt!: Table<Record<string, unknown>, string>
  cpt!: Table<Record<string, unknown>, string>
  estratigrafia!: Table<Record<string, unknown>, string>
  multimedia!: Table<Record<string, unknown>, string>
  outbox!: Table<OutboxItem, number>

  constructor() {
    super('geofield-db')
    this.version(1).stores({
      proyectos: 'id, nombre, updatedAt',
      sondeos: 'id, proyectoId, updatedAt',
      spt: 'id, sondeoId, updatedAt',
      cpt: 'id, sondeoId, updatedAt',
      estratigrafia: 'id, sondeoId, updatedAt',
      multimedia: 'id, sondeoId, updatedAt',
      outbox: '++id, resource, synced, createdAt',
    })
  }
}

export const db = new GeoFieldDB()
