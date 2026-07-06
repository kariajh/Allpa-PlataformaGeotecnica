import { useState } from 'react'
import { Plus, Ban } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

import { useDispositivosQuery } from '@/hooks/useDispositivos'
import { DispositivoFormDialog } from '../components/DispositivoFormDialog'
import { RevocarDispositivoDialog } from '../components/RevocarDispositivoDialog'
import type { Dispositivo } from '@/types'

export default function DispositivosPage() {
  const { data: dispositivos, isLoading, isError } = useDispositivosQuery()
  const [formOpen, setFormOpen] = useState(false)
  const [revocarTarget, setRevocarTarget] = useState<Dispositivo | null>(null)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Dispositivos</h1>
          <p className="text-sm text-muted-foreground">{dispositivos?.length ?? 0} registrado(s)</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />Registrar dispositivo
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading && <p className="text-sm text-muted-foreground p-6">Cargando...</p>}
          {isError && (
            <p className="text-sm text-destructive p-6">
              No se pudo conectar con el backend. Verificá que esté corriendo en localhost:8000.
            </p>
          )}
          {!isLoading && !isError && dispositivos?.length === 0 && (
            <p className="text-sm text-muted-foreground p-6">Todavía no hay dispositivos registrados.</p>
          )}
          {!isLoading && !isError && dispositivos && dispositivos.length > 0 && (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Responsable</TableHead>
                <TableHead>Device ID</TableHead>
                <TableHead>Último sync</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {dispositivos.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.nombre}</TableCell>
                    <TableCell>{d.responsable}</TableCell>
                    <TableCell className="font-mono text-xs">{d.device_id}</TableCell>
                    <TableCell>{d.ultimo_sync ? new Date(d.ultimo_sync).toLocaleString() : '—'}</TableCell>
                    <TableCell>
                      {d.activo ? (
                        <Badge variant="outline">Activo</Badge>
                      ) : (
                        <Badge variant="destructive" title={d.motivo_revocacion ?? undefined}>Revocado</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {d.activo && (
                        <Button variant="ghost" size="icon" onClick={() => setRevocarTarget(d)} title="Revocar acceso">
                          <Ban className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <DispositivoFormDialog open={formOpen} onOpenChange={setFormOpen} />
      <RevocarDispositivoDialog
        dispositivo={revocarTarget}
        onOpenChange={(open) => !open && setRevocarTarget(null)}
      />
    </div>
  )
}