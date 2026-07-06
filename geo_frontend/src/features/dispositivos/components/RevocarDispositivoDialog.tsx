import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'

import { useRevocarDispositivo } from '@/hooks/useDispositivos'
import type { Dispositivo } from '@/types'

const schema = z.object({ motivo: z.string().min(5, 'Contá brevemente el motivo') })
type FormValues = z.infer<typeof schema>

interface Props {
  dispositivo: Dispositivo | null
  onOpenChange: (open: boolean) => void
}

export function RevocarDispositivoDialog({ dispositivo, onOpenChange }: Props) {
  const revocarMutation = useRevocarDispositivo()
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { motivo: '' } })

  useEffect(() => { if (dispositivo) form.reset({ motivo: '' }) }, [dispositivo, form])

  async function onSubmit(values: FormValues) {
    if (!dispositivo) return
    try {
      await revocarMutation.mutateAsync({ deviceId: dispositivo.device_id, motivo: values.motivo })
      toast.success('Dispositivo revocado')
      onOpenChange(false)
    } catch {
      toast.error('No se pudo revocar el dispositivo.')
    }
  }

  return (
    <Dialog open={Boolean(dispositivo)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Revocar {dispositivo?.nombre}</DialogTitle>
          <DialogDescription>
            El dispositivo dejará de poder sincronizar. El registro se conserva para auditoría.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="motivo" render={({ field }) => (
              <FormItem>
                <FormLabel>Motivo *</FormLabel>
                <FormControl><Textarea placeholder="¿Por qué se revoca este dispositivo?" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" variant="destructive" disabled={revocarMutation.isPending}>
                {revocarMutation.isPending ? 'Revocando...' : 'Revocar acceso'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}