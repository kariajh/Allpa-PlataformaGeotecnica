import { useState } from 'react'
import { Plus, Lock, LockOpen } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

import { useProyectosQuery } from '@/hooks/useProyectos'
import { useSondeosQuery } from '@/hooks/useSondeos'
import { SondeoFormDialog } from '../components/SondeoFormDialog'
import { CerrarSondeoDialog } from '../components/CerrarSondeoDialog'
import { ReabrirSondeoDialog } from '../components/ReabrirSondeoDialog'
import type { Sondeo } from '@/types'

export default function SondeosPage() {
  const { data: proyectos } = useProyectosQuery()
  const [proyectoId, setProyectoId] = useState<string | undefined>()

  const { data: sondeos, isLoading, isError } = useSondeosQuery(proyectoId)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [cerrarTarget, setCerrarTarget] = useState<Sondeo | null>(null)
  const [reabrirTarget, setReabrirTarget] = useState<Sondeo | null>(null)

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-xl font-semibold">Sondeos</h1>
          <p className="text-sm text-muted-foreground">
            {sondeos?.length ?? 0} sondeo(s) en el proyecto seleccionado
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={proyectoId} onValueChange={setProyectoId}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Elegir proyecto" />
            </SelectTrigger>
            <SelectContent>
              {proyectos?.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setDialogOpen(true)} disabled={!proyectoId}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo sondeo
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {!proyectoId && (
            <p className="text-sm text-muted-foreground p-6">
              Elegí un proyecto arriba para ver sus sondeos.
            </p>
          )}

          {proyectoId && isLoading && (
            <p className="text-sm text-muted-foreground p-6">Cargando sondeos...</p>
          )}

          {proyectoId && isError && (
            <p className="text-sm text-destructive p-6">
              No se pudo conectar con el backend. Verificá que esté corriendo en localhost:8000.
            </p>
          )}

          {proyectoId && !isLoading && !isError && sondeos?.length === 0 && (
            <p className="text-sm text-muted-foreground p-6">
              Este proyecto todavía no tiene sondeos. Creá el primero con el botón de arriba.
            </p>
          )}

          {proyectoId && !isLoading && !isError && sondeos && sondeos.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Lat / Lon</TableHead>
                  <TableHead>Prof. total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sondeos.map((sondeo) => (
                  <TableRow key={sondeo.id}>
                    <TableCell className="font-medium">{sondeo.codigo}</TableCell>
                    <TableCell>{sondeo.tipo}</TableCell>
                    <TableCell>
                      {sondeo.latitud.toFixed(5)}, {sondeo.longitud.toFixed(5)}
                    </TableCell>
                    <TableCell>{sondeo.profundidad_total ?? '—'}</TableCell>
                    <TableCell>
                      <Badge variant={sondeo.estado === 'cerrado' ? 'default' : 'outline'}>
                        {sondeo.estado}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {sondeo.estado !== 'cerrado' ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setCerrarTarget(sondeo)}
                          title="Cerrar y firmar sondeo"
                        >
                          <Lock className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setReabrirTarget(sondeo)}
                          title="Reabrir sondeo (Admin)"
                        >
                          <LockOpen className="h-4 w-4" />
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

      {proyectoId && (
        <>
          <SondeoFormDialog open={dialogOpen} onOpenChange={setDialogOpen} proyectoId={proyectoId} />
          <CerrarSondeoDialog
            sondeo={cerrarTarget}
            onOpenChange={(open) => !open && setCerrarTarget(null)}
            proyectoId={proyectoId}
          />
          <ReabrirSondeoDialog
            sondeo={reabrirTarget}
            onOpenChange={(open) => !open && setReabrirTarget(null)}
            proyectoId={proyectoId}
          />
        </>
      )}
    </div>
  )
}