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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { muestraSchema, type MuestraFormValues } from '../schema'
import { useCreateMuestra } from '@/hooks/useMuestras'
import { TIPOS_MUESTRA } from '@/types'

const TIPO_LABELS: Record<string, string> = {
  alterada: 'Alterada', inalterada: 'Inalterada', bloque: 'Bloque', shelby: 'Shelby', mazier: 'Mazier',
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  sondeoId: string
}

const emptyValues: Partial<MuestraFormValues> = { profundidad: 0 }

export function MuestraFormDialog({ open, onOpenChange, sondeoId }: Props) {
  const createMutation = useCreateMuestra(sondeoId)
  const form = useForm<MuestraFormValues>({
    resolver: zodResolver(muestraSchema),
    defaultValues: emptyValues as MuestraFormValues,
  })

  useEffect(() => { if (open) form.reset(emptyValues as MuestraFormValues) }, [open, form])

  async function onSubmit(values: MuestraFormValues) {
    try {
      const creada = await createMutation.mutateAsync(values)
      toast.success(`Muestra ${creada.codigo} registrada con QR generado`)
      onOpenChange(false)
    } catch {
      toast.error('No se pudo registrar la muestra.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva muestra</DialogTitle>
          <DialogDescription>El código y el QR se generan automáticamente al guardar.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="tipo" render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Elegir tipo" /></SelectTrigger></FormControl>
                  <SelectContent>{TIPOS_MUESTRA.map((t) => <SelectItem key={t} value={t}>{TIPO_LABELS[t]}</SelectItem>)}</SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="profundidad" render={({ field }) => (
              <FormItem><FormLabel>Profundidad (m) *</FormLabel><FormControl><Input type="number" step="any" {...field} /></FormControl><FormMessage /></FormItem>
            )} />

            <div className="flex gap-2">
              <FormField control={form.control} name="diametro_mm" render={({ field }) => (
                <FormItem className="flex-1"><FormLabel>Diámetro (mm)</FormLabel><FormControl><Input type="number" step="1" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="recuperacion_pct" render={({ field }) => (
                <FormItem className="flex-1"><FormLabel>Recuperación (%)</FormLabel><FormControl><Input type="number" step="any" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={createMutation.isPending}>{createMutation.isPending ? 'Guardando...' : 'Registrar muestra'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}