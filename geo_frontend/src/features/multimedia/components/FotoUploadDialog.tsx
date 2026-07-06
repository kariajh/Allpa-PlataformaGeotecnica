import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { useUploadFoto } from '@/hooks/useFotos'
import { useMuestrasQuery } from '@/hooks/useMuestras'

const TIPOS_ACEPTADOS = ['image/jpeg', 'image/png', 'image/heic', 'image/webp']
const LIMITE_BYTES = 20 * 1024 * 1024 // 20 MB (límite documentado por el backend)

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  sondeoId: string
}

export function FotoUploadDialog({ open, onOpenChange, sondeoId }: Props) {
  const uploadMutation = useUploadFoto(sondeoId)
  const { data: muestras } = useMuestrasQuery(sondeoId)

  const [archivo, setArchivo] = useState<File | null>(null)
  const [muestraId, setMuestraId] = useState<string | undefined>()
  const [descripcion, setDescripcion] = useState('')

  function handleClose(next: boolean) {
    if (!next) {
      setArchivo(null)
      setMuestraId(undefined)
      setDescripcion('')
    }
    onOpenChange(next)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!TIPOS_ACEPTADOS.includes(file.type)) {
      toast.error('Formato no soportado. Usá JPEG, PNG, HEIC o WebP.')
      return
    }
    if (file.size > LIMITE_BYTES) {
      toast.error('El archivo supera el límite de 20 MB.')
      return
    }
    setArchivo(file)
  }

  async function handleSubir() {
    if (!archivo) return
    try {
      await uploadMutation.mutateAsync({ archivo, muestraId, descripcion: descripcion || undefined })
      toast.success('Foto subida. GPS extraído del EXIF si estaba disponible.')
      handleClose(false)
    } catch {
      toast.error('No se pudo subir la foto. Revisá la conexión con el backend.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Subir foto</DialogTitle>
          <DialogDescription>
            JPEG, PNG, HEIC o WebP, hasta 20 MB. El GPS se extrae automáticamente del EXIF si
            la foto lo trae.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <input
            type="file"
            accept="image/jpeg,image/png,image/heic,image/webp"
            onChange={handleFileChange}
            className="text-sm file:mr-3 file:rounded-md file:border file:border-border file:bg-secondary file:px-3 file:py-1.5 file:text-sm"
          />

          <div>
            <label className="text-sm font-medium block mb-1.5">Vincular a muestra (opcional)</label>
            <Select value={muestraId} onValueChange={setMuestraId}>
              <SelectTrigger><SelectValue placeholder="Sin vincular" /></SelectTrigger>
              <SelectContent>
                {muestras?.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.codigo}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium block mb-1.5">Descripción (opcional)</label>
            <Textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej: vista general del pozo a 2m"
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleClose(false)}>Cancelar</Button>
          <Button onClick={handleSubir} disabled={!archivo || uploadMutation.isPending}>
            {uploadMutation.isPending ? 'Subiendo...' : 'Subir foto'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}