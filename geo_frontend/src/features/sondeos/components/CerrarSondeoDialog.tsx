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

import { useCerrarSondeo } from '@/hooks/useSondeos'
import type { Sondeo } from '@/types'

const cerrarSchema = z.object({
  operador: z.string().min(2, 'Ingresá el nombre del operador'),
})
type CerrarFormValues = z.infer<typeof cerrarSchema>

interface CerrarSondeoDialogProps {
  sondeo: Sondeo | null
  onOpenChange: (open: boolean) => void
  proyectoId: string
}

export function CerrarSondeoDialog({ sondeo, onOpenChange, proyectoId }: CerrarSondeoDialogProps) {
  const cerrarMutation = useCerrarSondeo(proyectoId)
  const form = useForm<CerrarFormValues>({
    resolver: zodResolver(cerrarSchema),
    defaultValues: { operador: '' },
  })

  useEffect(() => {
    if (sondeo) form.reset({ operador: '' })
  }, [sondeo, form])

  async function onSubmit(values: CerrarFormValues) {
    if (!sondeo) return
    try {
      await cerrarMutation.mutateAsync({ id: sondeo.id, operador: values.operador })
      toast.success('Sondeo cerrado y firmado')
      onOpenChange(false)
    } catch {
      toast.error('No se pudo cerrar el sondeo.')
    }
  }

  return (
    <Dialog open={Boolean(sondeo)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cerrar sondeo {sondeo?.codigo}</DialogTitle>
          <DialogDescription>
            Esta acción firma digitalmente el sondeo (CU-03). Una vez cerrado, solo un
            usuario Admin puede reabrirlo.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="operador"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Operador que firma *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre y apellido" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={cerrarMutation.isPending}>
                {cerrarMutation.isPending ? 'Cerrando...' : 'Cerrar sondeo'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}