import { useState } from 'react'
import { Plus, QrCode } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

import { useProyectosQuery } from '@/hooks/useProyectos'
import { useSondeosQuery } from '@/hooks/useSondeos'
import { useEstratosQuery } from '@/hooks/useEstratos'
import { useMuestrasQuery } from '@/hooks/useMuestras'
import { EstratoFormDialog } from '../components/EstratoFormDialog'
import { MuestraFormDialog } from '../components/MuestraFormDialog'
import { muestrasApi } from '@/api/muestras'

export default function EstratigrafiaPage() {
  const { data: proyectos } = useProyectosQuery()
  const [proyectoId, setProyectoId] = useState<string | undefined>()
  const { data: sondeos } = useSondeosQuery(proyectoId)
  const [sondeoId, setSondeoId] = useState<string | undefined>()

  const { data: estratos } = useEstratosQuery(sondeoId)
  const { data: muestras } = useMuestrasQuery(sondeoId)
  const [estratoOpen, setEstratoOpen] = useState(false)
  const [muestraOpen, setMuestraOpen] = useState(false)

  function handleProyectoChange(value: string) {
    setProyectoId(value)
    setSondeoId(undefined)
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-2 gap-4 flex-wrap">
        <h1 className="text-xl font-semibold">Estratigrafía / Muestras</h1>
        <div className="flex items-center gap-3">
          <Select value={proyectoId} onValueChange={handleProyectoChange}>
            <SelectTrigger className="w-56"><SelectValue placeholder="Elegir proyecto" /></SelectTrigger>
            <SelectContent>{proyectos?.map((p) => <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={sondeoId} onValueChange={setSondeoId} disabled={!proyectoId}>
            <SelectTrigger className="w-56"><SelectValue placeholder="Elegir sondeo" /></SelectTrigger>
            <SelectContent>{sondeos?.map((s) => <SelectItem key={s.id} value={s.id}>{s.codigo}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      {!sondeoId && (
        <Card><CardContent className="p-6 text-sm text-muted-foreground">
          Elegí un proyecto y un sondeo arriba para ver su estratigrafía y muestras.
        </CardContent></Card>
      )}

      {sondeoId && (
        <>
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-medium">Estratos</h2>
              <Button size="sm" onClick={() => setEstratoOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />Nuevo estrato
              </Button>
            </div>
            <Card><CardContent className="p-0">
              {estratos?.length === 0 && <p className="text-sm text-muted-foreground p-6">Sin estratos cargados.</p>}
              {estratos && estratos.length > 0 && (
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Prof. tope</TableHead><TableHead>Prof. base</TableHead>
                    <TableHead>Color</TableHead><TableHead>Textura</TableHead>
                    <TableHead>Consistencia</TableHead><TableHead>Humedad</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {estratos.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell>{e.prof_tope}</TableCell>
                        <TableCell>{e.prof_base}</TableCell>
                        <TableCell>{e.color}</TableCell>
                        <TableCell><Badge variant="outline">{e.textura}</Badge></TableCell>
                        <TableCell>{e.consistencia ?? '—'}</TableCell>
                        <TableCell>{e.humedad ?? '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent></Card>
          </section>

          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-medium">Muestras</h2>
              <Button size="sm" onClick={() => setMuestraOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />Nueva muestra
              </Button>
            </div>
            <Card><CardContent className="p-0">
              {muestras?.length === 0 && <p className="text-sm text-muted-foreground p-6">Sin muestras cargadas.</p>}
              {muestras && muestras.length > 0 && (
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Código</TableHead><TableHead>Tipo</TableHead>
                    <TableHead>Prof.</TableHead><TableHead>Diámetro</TableHead>
                    <TableHead>Recuperación</TableHead><TableHead className="text-right">QR</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {muestras.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium">{m.codigo}</TableCell>
                        <TableCell><Badge variant="outline">{m.tipo}</Badge></TableCell>
                        <TableCell>{m.profundidad}</TableCell>
                        <TableCell>{m.diametro_mm ?? '—'}</TableCell>
                        <TableCell>{m.recuperacion_pct ?? '—'}</TableCell>
                        <TableCell className="text-right">
                          <a href={muestrasApi.qrImageUrl(m.id)} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="icon" title="Ver / imprimir QR">
                              <QrCode className="h-4 w-4" />
                            </Button>
                          </a>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent></Card>
          </section>

          <EstratoFormDialog open={estratoOpen} onOpenChange={setEstratoOpen} sondeoId={sondeoId} />
          <MuestraFormDialog open={muestraOpen} onOpenChange={setMuestraOpen} sondeoId={sondeoId} />
        </>
      )}
    </div>
  )
}
