import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

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

  useEffect(() => { if (open) form.reset(emptyValues) }, [open, form])

  async function onSubmit(values: DispositivoFormValues) {
    try {
      await createMutation.mutateAsync(values)
      toast.success('Dispositivo registrado')
      onOpenChange(false)
    } catch {
      toast.error('No se pudo registrar el dispositivo.')
    }
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