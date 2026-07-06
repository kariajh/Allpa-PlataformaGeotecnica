import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

import { useReabrirSondeo } from '@/hooks/useSondeos'
import type { Sondeo } from '@/types'

const reabrirSchema = z.object({
  operador: z.string().min(2, 'Ingresá el nombre del operador'),
  motivo: z.string().min(5, 'Contá brevemente el motivo'),
})
type ReabrirFormValues = z.infer<typeof reabrirSchema>

interface ReabrirSondeoDialogProps {
  sondeo: Sondeo | null
  onOpenChange: (open: boolean) => void
  proyectoId: string
}

export function ReabrirSondeoDialog({ sondeo, onOpenChange, proyectoId }: ReabrirSondeoDialogProps) {
  const reabrirMutation = useReabrirSondeo(proyectoId)
  const form = useForm<ReabrirFormValues>({
    resolver: zodResolver(reabrirSchema),
    defaultValues: { operador: '', motivo: '' },
  })

  useEffect(() => {
    if (sondeo) form.reset({ operador: '', motivo: '' })
  }, [sondeo, form])

  async function onSubmit(values: ReabrirFormValues) {
    if (!sondeo) return
    try {
      await reabrirMutation.mutateAsync({ id: sondeo.id, ...values })
      toast.success('Sondeo reabierto')
      onOpenChange(false)
    } catch {
      // TODO: cuando haya auth con roles, distinguir 403 (no es Admin) de
      // otros errores para mostrar un mensaje más específico acá.
      toast.error('No se pudo reabrir. Confirmá que tu usuario tiene rol Admin.')
    }
  }

  return (
    <Dialog open={Boolean(sondeo)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reabrir sondeo {sondeo?.codigo}</DialogTitle>
          <DialogDescription>
            Requiere rol Admin (RN-09). El motivo queda registrado en la auditoría.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="operador"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Operador *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre y apellido" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="motivo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo *</FormLabel>
                  <FormControl>
                    <Textarea placeholder="¿Por qué se reabre este sondeo?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={reabrirMutation.isPending}>
                {reabrirMutation.isPending ? 'Reabriendo...' : 'Reabrir sondeo'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}