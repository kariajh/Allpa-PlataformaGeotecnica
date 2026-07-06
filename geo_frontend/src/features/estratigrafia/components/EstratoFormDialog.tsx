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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { estratoSchema, type EstratoFormValues } from '../schema'
import { useCreateEstrato, isConflictoSolapamiento } from '@/hooks/useEstratos'
import { TEXTURAS_ESTRATO, CONSISTENCIAS_ESTRATO, HUMEDADES_ESTRATO } from '@/types'

const TEXTURA_LABELS: Record<string, string> = { arena: 'Arena', limo: 'Limo', arcilla: 'Arcilla', grava: 'Grava', roca: 'Roca' }
const CONSISTENCIA_LABELS: Record<string, string> = { muy_blanda: 'Muy blanda', blanda: 'Blanda', media: 'Media', firme: 'Firme', dura: 'Dura' }
const HUMEDAD_LABELS: Record<string, string> = { seco: 'Seco', humedo: 'Húmedo', muy_humedo: 'Muy húmedo', saturado: 'Saturado' }

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  sondeoId: string
}

const emptyValues: Partial<EstratoFormValues> = { prof_tope: 0, prof_base: 0, color: '' }

export function EstratoFormDialog({ open, onOpenChange, sondeoId }: Props) {
  const createMutation = useCreateEstrato(sondeoId)
  const form = useForm<EstratoFormValues>({
    resolver: zodResolver(estratoSchema),
    defaultValues: emptyValues as EstratoFormValues,
  })

  useEffect(() => { if (open) form.reset(emptyValues as EstratoFormValues) }, [open, form])

  async function onSubmit(values: EstratoFormValues) {
    try {
      await createMutation.mutateAsync(values)
      toast.success('Estrato registrado')
      onOpenChange(false)
    } catch (err) {
      if (isConflictoSolapamiento(err)) {
        toast.error('Ese rango de profundidad se superpone con otro estrato ya cargado.')
      } else {
        toast.error('No se pudo registrar el estrato.')
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo estrato</DialogTitle>
          <DialogDescription>El rango de profundidad no puede superponerse con otro estrato del mismo sondeo.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex gap-2">
              <FormField control={form.control} name="prof_tope" render={({ field }) => (
                <FormItem className="flex-1"><FormLabel>Prof. tope (m) *</FormLabel><FormControl><Input type="number" step="any" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="prof_base" render={({ field }) => (
                <FormItem className="flex-1"><FormLabel>Prof. base (m) *</FormLabel><FormControl><Input type="number" step="any" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>

            <div className="flex gap-2">
              <FormField control={form.control} name="color" render={({ field }) => (
                <FormItem className="flex-1"><FormLabel>Color *</FormLabel><FormControl><Input placeholder="Ej: marrón oscuro" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="textura" render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Textura *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Elegir" /></SelectTrigger></FormControl>
                    <SelectContent>{TEXTURAS_ESTRATO.map((t) => <SelectItem key={t} value={t}>{TEXTURA_LABELS[t]}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="flex gap-2">
              <FormField control={form.control} name="consistencia" render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Consistencia</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger></FormControl>
                    <SelectContent>{CONSISTENCIAS_ESTRATO.map((c) => <SelectItem key={c} value={c}>{CONSISTENCIA_LABELS[c]}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="humedad" render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Humedad</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger></FormControl>
                    <SelectContent>{HUMEDADES_ESTRATO.map((h) => <SelectItem key={h} value={h}>{HUMEDAD_LABELS[h]}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="descripcion_libre" render={({ field }) => (
              <FormItem><FormLabel>Descripción</FormLabel><FormControl><Textarea placeholder="Observaciones adicionales" {...field} /></FormControl><FormMessage /></FormItem>
            )} />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={createMutation.isPending}>{createMutation.isPending ? 'Guardando...' : 'Registrar estrato'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}