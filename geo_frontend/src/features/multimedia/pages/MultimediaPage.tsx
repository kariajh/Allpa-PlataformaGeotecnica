import { useState } from 'react'
import { Upload } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

import { useProyectosQuery } from '@/hooks/useProyectos'
import { useSondeosQuery } from '@/hooks/useSondeos'
import { useMuestrasQuery } from '@/hooks/useMuestras'
import { useFotosQuery } from '@/hooks/useFotos'
import { fotosApi } from '@/api/fotos'
import { FotoUploadDialog } from '../components/FotoUploadDialog'
import { SYNC_STATUS_LABELS } from '@/types'

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function MultimediaPage() {
  const { data: proyectos } = useProyectosQuery()
  const [proyectoId, setProyectoId] = useState<string | undefined>()
  const { data: sondeos } = useSondeosQuery(proyectoId)
  const [sondeoId, setSondeoId] = useState<string | undefined>()

  const { data: muestras } = useMuestrasQuery(sondeoId)
  const { data: fotos, isLoading, isError } = useFotosQuery(sondeoId)
  const [uploadOpen, setUploadOpen] = useState(false)

  function handleProyectoChange(value: string) {
    setProyectoId(value)
    setSondeoId(undefined)
  }

  const codigoMuestra = (muestraId: string | null) =>
    muestraId ? muestras?.find((m) => m.id === muestraId)?.codigo ?? muestraId : '—'

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold">Multimedia</h1>
          <p className="text-sm text-muted-foreground">
            {fotos?.length ?? 0} archivo(s) en el sondeo seleccionado
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={proyectoId} onValueChange={handleProyectoChange}>
            <SelectTrigger className="w-56"><SelectValue placeholder="Elegir proyecto" /></SelectTrigger>
            <SelectContent>{proyectos?.map((p) => <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={sondeoId} onValueChange={setSondeoId} disabled={!proyectoId}>
            <SelectTrigger className="w-56"><SelectValue placeholder="Elegir sondeo" /></SelectTrigger>
            <SelectContent>{sondeos?.map((s) => <SelectItem key={s.id} value={s.id}>{s.codigo}</SelectItem>)}</SelectContent>
          </Select>
          <Button onClick={() => setUploadOpen(true)} disabled={!sondeoId}>
            <Upload className="h-4 w-4 mr-2" />Subir foto
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {!sondeoId && (
            <p className="text-sm text-muted-foreground p-6">
              Elegí un proyecto y un sondeo arriba para ver sus fotos.
            </p>
          )}
          {sondeoId && isLoading && <p className="text-sm text-muted-foreground p-6">Cargando...</p>}
          {sondeoId && isError && (
            <p className="text-sm text-destructive p-6">
              No se pudo conectar con el backend. Verificá que esté corriendo en localhost:8000.
            </p>
          )}
          {sondeoId && !isLoading && !isError && fotos?.length === 0 && (
            <p className="text-sm text-muted-foreground p-6">Este sondeo todavía no tiene fotos.</p>
          )}
          {sondeoId && !isLoading && !isError && fotos && fotos.length > 0 && (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Vista previa</TableHead>
                <TableHead>Archivo</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Tamaño</TableHead>
                <TableHead>GPS (EXIF)</TableHead>
                <TableHead>Muestra</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Sync</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {fotos.map((foto) => (
                  <TableRow key={foto.id}>
                    <TableCell>
                      <a href={fotosApi.imageUrl(foto.id)} target="_blank" rel="noopener noreferrer">
                        <img
                          src={fotosApi.thumbnailUrl(foto.id, 64, 64)}
                          alt={foto.nombre_archivo}
                          className="h-12 w-12 object-cover rounded-md border border-border"
                        />
                      </a>
                    </TableCell>
                    <TableCell className="font-medium">{foto.nombre_archivo}</TableCell>
                    <TableCell>{foto.mime_type}</TableCell>
                    <TableCell>{formatBytes(foto.tamanio_bytes)}</TableCell>
                    <TableCell>
                      {foto.latitud_exif != null && foto.longitud_exif != null
                        ? `${foto.latitud_exif.toFixed(5)}, ${foto.longitud_exif.toFixed(5)}`
                        : '—'}
                    </TableCell>
                    <TableCell>{codigoMuestra(foto.muestra_id)}</TableCell>
                    <TableCell className="max-w-\[200px]\ truncate">{foto.descripcion ?? '—'}</TableCell>
                    <TableCell>
                      <Badge variant={foto.sync_status === 'conflict' ? 'destructive' : 'outline'}>
                        {SYNC_STATUS_LABELS[foto.sync_status]}
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
        <FotoUploadDialog open={uploadOpen} onOpenChange={setUploadOpen} sondeoId={sondeoId} />
      )}
    </div>
  )
}