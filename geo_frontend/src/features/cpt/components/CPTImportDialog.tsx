import { useState } from 'react'
import { toast } from 'sonner'
import { Upload } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'

import { useImportCPTCsv } from '@/hooks/useCPT'
import type { ImportacionCSVResult } from '@/types'

interface CPTImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sondeoId: string
}

export function CPTImportDialog({ open, onOpenChange, sondeoId }: CPTImportDialogProps) {
  const importMutation = useImportCPTCsv(sondeoId)
  const [archivo, setArchivo] = useState<File | null>(null)
  const [resultado, setResultado] = useState<ImportacionCSVResult | null>(null)

  function handleClose(nextOpen: boolean) {
    if (!nextOpen) {
      setArchivo(null)
      setResultado(null)
    }
    onOpenChange(nextOpen)
  }

  async function handleImportar() {
    if (!archivo) return
    try {
      const res = await importMutation.mutateAsync(archivo)
      setResultado(res)
      if (res.lecturas_con_error === 0) {
        toast.success(`${res.lecturas_importadas} lectura(s) importada(s) sin errores`)
      } else {
        toast.warning(
          `${res.lecturas_importadas} importada(s), ${res.lecturas_con_error} con error`
        )
      }
    } catch {
      toast.error('No se pudo importar el archivo. Revisá la conexión con el backend.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Importar lecturas CPT desde CSV</DialogTitle>
          <DialogDescription>
            Formato requerido: columnas <code>profundidad,qc,fs</code>. Las filas válidas
            se importan aunque otras tengan errores.
          </DialogDescription>
        </DialogHeader>

        {!resultado && (
          <div className="space-y-4">
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
              className="text-sm file:mr-3 file:rounded-md file:border file:border-border file:bg-secondary file:px-3 file:py-1.5 file:text-sm"
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleClose(false)}>
                Cancelar
              </Button>
              <Button onClick={handleImportar} disabled={!archivo || importMutation.isPending}>
                <Upload className="h-4 w-4 mr-2" />
                {importMutation.isPending ? 'Importando...' : 'Importar'}
              </Button>
            </DialogFooter>
          </div>
        )}

        {resultado && (
          <div className="space-y-4">
            <div className="flex gap-4 text-sm">
              <Badge variant="outline">{resultado.lecturas_importadas} importadas</Badge>
              {resultado.lecturas_con_error > 0 && (
                <Badge variant="destructive">{resultado.lecturas_con_error} con error</Badge>
              )}
            </div>

            {resultado.errores.length > 0 && (
              <div className="max-h-60 overflow-y-auto border border-border rounded-md">
                <table className="w-full text-xs">
                  <thead className="bg-secondary sticky top-0">
                    <tr>
                      <th className="text-left p-2">Fila</th>
                      <th className="text-left p-2">Contenido</th>
                      <th className="text-left p-2">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultado.errores.map((err, i) => (
                      <tr key={i} className="border-t border-border">
                        <td className="p-2">{err.fila}</td>
                        <td className="p-2 font-mono">{err.contenido}</td>
                        <td className="p-2 text-destructive">{err.error}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <DialogFooter>
              <Button onClick={() => handleClose(false)}>Cerrar</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}