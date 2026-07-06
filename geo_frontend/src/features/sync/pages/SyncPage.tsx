import { useState } from 'react'
import { toast } from 'sonner'
import { Upload, AlertTriangle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

import { useImportarGeopack, usePendientesSync } from '@/hooks/useSync'
import { getDeviceId } from '@/lib/device'
import type { GeopackImportResponse } from '@/types'

export default function SyncPage() {
  const { data: pendientes } = usePendientesSync()
  const importarMutation = useImportarGeopack()
  const [archivo, setArchivo] = useState<File | null>(null)
  const [resultado, setResultado] = useState<GeopackImportResponse | null>(null)

  async function handleImportar() {
    if (!archivo) return
    try {
      const res = await importarMutation.mutateAsync(archivo)
      setResultado(res)
      toast.success(`${res.registros_importados} registro(s) importado(s)`)
    } catch {
      toast.error('No se pudo importar el geopack. Verificá la firma digital del archivo.')
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold">Sincronización</h1>

      {/* Sincronización delta: pendiente de definir el esquema de firma HMAC */}
      <section>
        <h2 className="text-lg font-medium mb-3">Sincronización delta (WiFi / Starlink)</h2>
        <Card><CardContent className="p-6 space-y-3">
          <div className="flex items-start gap-2 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-4 py-3">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              Pendiente de definir cómo el dispositivo obtiene la clave para firmar el
              payload (HMAC-SHA256, RN-07). El backend va a rechazar esta sincronización
              hasta resolverlo — avisame cuando esté definido y la conecto.
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {pendientes?.length ?? 0} cambio(s) pendiente(s) de sincronizar en este dispositivo.
          </p>
          <Button disabled>Sincronizar ahora</Button>
        </CardContent></Card>
      </section>

      {/* Importación de .geopack: funcional */}
      <section>
        <h2 className="text-lg font-medium mb-3">Importar paquete .geopack (USB / SD)</h2>
        <Card><CardContent className="p-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            Dispositivo actual: <span className="font-mono">{getDeviceId()}</span>
          </p>
          <input
            type="file"
            accept=".geopack"
            onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
            className="text-sm file:mr-3 file:rounded-md file:border file:border-border file:bg-secondary file:px-3 file:py-1.5 file:text-sm"
          />
          <Button onClick={handleImportar} disabled={!archivo || importarMutation.isPending}>
            <Upload className="h-4 w-4 mr-2" />
            {importarMutation.isPending ? 'Importando...' : 'Importar geopack'}
          </Button>

          {resultado && (
            <div className="flex gap-3 flex-wrap pt-2">
              <Badge variant="outline">{resultado.registros_importados} importados</Badge>
              <Badge variant="outline">{resultado.synced} sincronizados</Badge>
              <Badge variant="outline">{resultado.omitidos} omitidos</Badge>
              {resultado.conflictos > 0 && (
                <Badge variant="destructive">{resultado.conflictos} conflicto(s)</Badge>
              )}
            </div>
          )}
        </CardContent></Card>
      </section>
    </div>
  )
}