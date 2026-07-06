import { useState } from 'react'
import { Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

import { useEventosRecientesQuery, useHistorialEntidadQuery } from '@/hooks/useAuditoria'
import type { RegistroAuditoria } from '@/types'

const ACCION_LABELS: Record<string, string> = {
  creacion: 'Creación', modificacion: 'Modificación', cierre: 'Cierre',
  sync: 'Sincronización', geopack: 'Geopack', reapertura: 'Reapertura',
}

// Mejor apuesta, sin enum confirmado contra el backend (ver src/api/auditoria.ts).
const TIPOS_ENTIDAD = ['proyecto', 'sondeo', 'ensayo_spt', 'ensayo_cpt', 'estrato', 'muestra', 'dispositivo', 'foto']

function TablaAuditoria({ registros, mostrarEntidad = true }: { registros: RegistroAuditoria[]; mostrarEntidad?: boolean }) {
  if (registros.length === 0) {
    return <p className="text-sm text-muted-foreground p-6">Sin eventos.</p>
  }
  return (
    <Table>
      <TableHeader><TableRow>
        <TableHead>Fecha</TableHead>
        {mostrarEntidad && <TableHead>Entidad</TableHead>}
        <TableHead>Acción</TableHead>
        <TableHead>Usuario</TableHead>
        <TableHead>Descripción</TableHead>
      </TableRow></TableHeader>
      <TableBody>
        {registros.map((r) => (
          <TableRow key={r.id}>
            <TableCell>{new Date(r.timestamp).toLocaleString()}</TableCell>
            {mostrarEntidad && <TableCell className="font-mono text-xs">{r.entidad}</TableCell>}
            <TableCell><Badge variant="outline">{ACCION_LABELS[r.tipo_accion] ?? r.tipo_accion}</Badge></TableCell>
            <TableCell>{r.usuario}</TableCell>
            <TableCell className="max-w-[300px] truncate">{r.descripcion ?? '—'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export default function AuditoriaPage() {
  const [limite, setLimite] = useState('50')
  const { data: recientes, isLoading, isError } = useEventosRecientesQuery(Number(limite))

  const [entidad, setEntidad] = useState<string | undefined>()
  const [entidadIdInput, setEntidadIdInput] = useState('')
  const [entidadIdBuscado, setEntidadIdBuscado] = useState<string | undefined>()
  const { data: historial, isFetching: buscando } = useHistorialEntidadQuery(entidad, entidadIdBuscado)

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center justify-between mb-3 gap-4 flex-wrap">
          <h1 className="text-xl font-semibold">Auditoría</h1>
          <Select value={limite} onValueChange={setLimite}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="20">Últimos 20</SelectItem>
              <SelectItem value="50">Últimos 50</SelectItem>
              <SelectItem value="100">Últimos 100</SelectItem>
              <SelectItem value="200">Últimos 200</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Card><CardContent className="p-0">
          {isLoading && <p className="text-sm text-muted-foreground p-6">Cargando...</p>}
          {isError && <p className="text-sm text-destructive p-6">No se pudo conectar con el backend.</p>}
          {recientes && <TablaAuditoria registros={recientes} />}
        </CardContent></Card>
      </div>

      <div>
        <h2 className="text-lg font-medium mb-3">Historial por entidad</h2>
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <Select value={entidad} onValueChange={setEntidad}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Tipo de entidad" /></SelectTrigger>
            <SelectContent>{TIPOS_ENTIDAD.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
          <Input
            placeholder="UUID de la entidad"
            value={entidadIdInput}
            onChange={(e) => setEntidadIdInput(e.target.value)}
            className="w-80"
          />
          <Button
            variant="outline"
            disabled={!entidad || !entidadIdInput}
            onClick={() => setEntidadIdBuscado(entidadIdInput)}
          >
            <Search className="h-4 w-4 mr-2" />Buscar
          </Button>
        </div>
        {entidadIdBuscado && (
          <Card><CardContent className="p-0">
            {buscando && <p className="text-sm text-muted-foreground p-6">Buscando...</p>}
            {!buscando && historial && <TablaAuditoria registros={historial} mostrarEntidad={false} />}
          </CardContent></Card>
        )}
      </div>
    </div>
  )
}