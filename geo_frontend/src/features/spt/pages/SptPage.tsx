import { useState } from 'react'
import { Plus, AlertTriangle } from 'lucide-react'

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
import { useSPTQuery } from '@/hooks/useSPT'
import { SPTFormDialog } from '../components/SPTFormDialog'

export default function SptPage() {
  const { data: proyectos } = useProyectosQuery()
  const [proyectoId, setProyectoId] = useState<string | undefined>()

  const { data: sondeos } = useSondeosQuery(proyectoId)
  const [sondeoId, setSondeoId] = useState<string | undefined>()

  const { data: ensayos, isLoading, isError } = useSPTQuery(sondeoId)
  const [dialogOpen, setDialogOpen] = useState(false)

  const sondeoSeleccionado = sondeos?.find((s) => s.id === sondeoId)
  const sondeoCerrado = sondeoSeleccionado?.estado === 'cerrado'

  function handleProyectoChange(value: string) {
    setProyectoId(value)
    setSondeoId(undefined) // cambiar de proyecto invalida el sondeo elegido
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold">Ensayos SPT</h1>
          <p className="text-sm text-muted-foreground">
            {ensayos?.length ?? 0} ensayo(s) en el sondeo seleccionado
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={proyectoId} onValueChange={handleProyectoChange}>
            <SelectTrigger className="w-56">
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

          <Select value={sondeoId} onValueChange={setSondeoId} disabled={!proyectoId}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Elegir sondeo" />
            </SelectTrigger>
            <SelectContent>
              {sondeos?.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.codigo} {s.estado === 'cerrado' ? '(cerrado)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={() => setDialogOpen(true)} disabled={!sondeoId || sondeoCerrado}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo ensayo
          </Button>
        </div>
      </div>

      {sondeoCerrado && (
        <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-4 py-2 mb-4">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Este sondeo está cerrado. No se pueden registrar nuevos ensayos hasta reabrirlo.
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {!sondeoId && (
            <p className="text-sm text-muted-foreground p-6">
              Elegí un proyecto y un sondeo arriba para ver sus ensayos SPT.
            </p>
          )}

          {sondeoId && isLoading && (
            <p className="text-sm text-muted-foreground p-6">Cargando ensayos...</p>
          )}

          {sondeoId && isError && (
            <p className="text-sm text-destructive p-6">
              No se pudo conectar con el backend. Verificá que esté corriendo en localhost:8000.
            </p>
          )}

          {sondeoId && !isLoading && !isError && ensayos?.length === 0 && (
            <p className="text-sm text-muted-foreground p-6">
              Este sondeo todavía no tiene ensayos SPT.
            </p>
          )}

          {sondeoId && !isLoading && !isError && ensayos && ensayos.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Prof. (m)</TableHead>
                  <TableHead>Martillo</TableHead>
                  <TableHead>T1 / T2 / T3</TableHead>
                  <TableHead>N campo</TableHead>
                  <TableHead>N60</TableHead>
                  <TableHead>Rechazo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ensayos.map((ensayo) => (
                  <TableRow key={ensayo.id}>
                    <TableCell className="font-medium">{ensayo.profundidad}</TableCell>
                    <TableCell>{ensayo.tipo_martillo}</TableCell>
                    <TableCell>
                      {ensayo.golpes_t1} / {ensayo.golpes_t2 ?? '—'} / {ensayo.golpes_t3 ?? '—'}
                    </TableCell>
                    <TableCell>{ensayo.n_campo ?? '—'}</TableCell>
                    <TableCell>{ensayo.n60 ?? '—'}</TableCell>
                    <TableCell>
                      {ensayo.rechazo ? (
                        <Badge variant="destructive">Rechazo</Badge>
                      ) : (
                        <Badge variant="outline">Normal</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {sondeoId && (
        <SPTFormDialog open={dialogOpen} onOpenChange={setDialogOpen} sondeoId={sondeoId} />
      )}
    </div>
  )
}