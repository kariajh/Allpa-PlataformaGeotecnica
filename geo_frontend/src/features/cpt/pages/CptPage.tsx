import { useState } from 'react'
import { Plus, Upload } from 'lucide-react'

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
import { useCPTQuery } from '@/hooks/useCPT'
import { CPTFormDialog } from '../components/CPTFormDialog'
import { CPTImportDialog } from '../components/CPTImportDialog'

const SYNC_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  synced: 'Sincronizado',
  conflict: 'Conflicto',
  partial: 'Parcial',
}

// Mejor apuesta, no confirmada contra un enum en swagger (a diferencia de
// sync_status). Si el backend usa otro string, cae al valor crudo (ver
// fallback más abajo con `?? lectura.origen`).
const ORIGEN_LABELS: Record<string, string> = {
  manual: 'Manual',
  csv: 'CSV',
}

export default function CptPage() {
  const { data: proyectos } = useProyectosQuery()
  const [proyectoId, setProyectoId] = useState<string | undefined>()

  const { data: sondeos } = useSondeosQuery(proyectoId)
  const [sondeoId, setSondeoId] = useState<string | undefined>()

  const { data: lecturas, isLoading, isError } = useCPTQuery(sondeoId)
  const [formOpen, setFormOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)

  function handleProyectoChange(value: string) {
    setProyectoId(value)
    setSondeoId(undefined)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold">Ensayos CPT</h1>
          <p className="text-sm text-muted-foreground">
            {lecturas?.length ?? 0} lectura(s) en el sondeo seleccionado
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
                  {s.codigo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={() => setImportOpen(true)} disabled={!sondeoId}>
            <Upload className="h-4 w-4 mr-2" />
            Importar CSV
          </Button>
          <Button onClick={() => setFormOpen(true)} disabled={!sondeoId}>
            <Plus className="h-4 w-4 mr-2" />
            Carga manual
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {!sondeoId && (
            <p className="text-sm text-muted-foreground p-6">
              Elegí un proyecto y un sondeo arriba para ver sus lecturas CPT.
            </p>
          )}

          {sondeoId && isLoading && (
            <p className="text-sm text-muted-foreground p-6">Cargando lecturas...</p>
          )}

          {sondeoId && isError && (
            <p className="text-sm text-destructive p-6">
              No se pudo conectar con el backend. Verificá que esté corriendo en localhost:8000.
            </p>
          )}

          {sondeoId && !isLoading && !isError && lecturas?.length === 0 && (
            <p className="text-sm text-muted-foreground p-6">
              Este sondeo todavía no tiene lecturas CPT.
            </p>
          )}

          {sondeoId && !isLoading && !isError && lecturas && lecturas.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Prof. (m)</TableHead>
                  <TableHead>qc</TableHead>
                  <TableHead>fs</TableHead>
                  <TableHead>Rf (%)</TableHead>
                  <TableHead>Origen</TableHead>
                  <TableHead>Sync</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lecturas.map((lectura) => (
                  <TableRow key={lectura.id}>
                    <TableCell className="font-medium">{lectura.profundidad}</TableCell>
                    <TableCell>{lectura.qc}</TableCell>
                    <TableCell>{lectura.fs}</TableCell>
                    <TableCell>{lectura.rf?.toFixed(2) ?? '—'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{ORIGEN_LABELS[lectura.origen] ?? lectura.origen}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={lectura.sync_status === 'conflict' ? 'destructive' : 'outline'}>
                        {SYNC_LABELS[lectura.sync_status] ?? lectura.sync_status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {sondeoId && (
        <>
          <CPTFormDialog open={formOpen} onOpenChange={setFormOpen} sondeoId={sondeoId} />
          <CPTImportDialog open={importOpen} onOpenChange={setImportOpen} sondeoId={sondeoId} />
        </>
      )}
    </div>
  )
}