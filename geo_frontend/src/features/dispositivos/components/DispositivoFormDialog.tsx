import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Copy, ShieldAlert } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

import { dispositivoSchema, type DispositivoFormValues } from '../schema'
import { useCreateDispositivo } from '@/hooks/useDispositivos'
import { getDeviceId } from '@/lib/device'
import { storeHmacKey } from '@/lib/hmac-store'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const emptyValues: DispositivoFormValues = { device_id: '', nombre: '', responsable: '', descripcion: '' }

export function DispositivoFormDialog({ open, onOpenChange }: Props) {
  const createMutation = useCreateDispositivo()
  const form = useForm<DispositivoFormValues>({
    resolver: zodResolver(dispositivoSchema),
    defaultValues: emptyValues,
  })

  // Tras crear, guardamos la clave localmente y la mostramos una vez acá
  // mismo (el servidor nunca la vuelve a exponer).
  const [hmacKeyMostrada, setHmacKeyMostrada] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      form.reset(emptyValues)
      setHmacKeyMostrada(null)
    }
  }, [open, form])

  async function onSubmit(values: DispositivoFormValues) {
    try {
      const creado = await createMutation.mutateAsync(values)
      storeHmacKey(creado.device_id, creado.hmac_key)
      setHmacKeyMostrada(creado.hmac_key)
      toast.success('Dispositivo registrado')
    } catch {
      toast.error('No se pudo registrar el dispositivo.')
    }
  }

  function copiarClave() {
    if (!hmacKeyMostrada) return
    navigator.clipboard.writeText(hmacKeyMostrada)
    toast.success('Clave copiada al portapapeles')
  }

  // Estado 2: mostrar la clave una sola vez, con aviso.
  if (hmacKeyMostrada) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-600" />
              Guardá esta clave ahora
            </DialogTitle>
            <DialogDescription>
              El servidor no vuelve a mostrar esta clave. Ya quedó guardada en este
              navegador para poder firmar sincronizaciones, pero si necesitás configurar
              este dispositivo en otro lugar, copiala ahora.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 bg-secondary rounded-md p-3">
            <code className="text-xs break-all flex-1">{hmacKeyMostrada}</code>
            <Button type="button" variant="ghost" size="icon" onClick={copiarClave}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Entendido, cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar dispositivo</DialogTitle>
          <DialogDescription>
            El primer acceso de un dispositivo nuevo requiere esta aprobación manual.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="device_id" render={({ field }) => (
              <FormItem>
                <FormLabel>Device ID *</FormLabel>
                <div className="flex gap-2">
                  <FormControl><Input placeholder="UUID del dispositivo" {...field} /></FormControl>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => form.setValue('device_id', getDeviceId(), { shouldValidate: true })}
                  >
                    Usar este dispositivo
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="nombre" render={({ field }) => (
              <FormItem><FormLabel>Nombre *</FormLabel><FormControl><Input placeholder="Ej: Tablet campo 1" {...field} /></FormControl><FormMessage /></FormItem>
            )} />

            <FormField control={form.control} name="responsable" render={({ field }) => (
              <FormItem><FormLabel>Responsable *</FormLabel><FormControl><Input placeholder="Nombre y apellido" {...field} /></FormControl><FormMessage /></FormItem>
            )} />

            <FormField control={form.control} name="descripcion" render={({ field }) => (
              <FormItem><FormLabel>Descripción</FormLabel><FormControl><Textarea placeholder="Opcional" {...field} /></FormControl><FormMessage /></FormItem>
            )} />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Guardando...' : 'Registrar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}