import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { sptSchema, type SPTFormValues } from '../schema'
import { useCreateSPT } from '@/hooks/useSPT'
import { TIPOS_MARTILLO } from '@/types'

const MARTILLO_LABELS: Record<(typeof TIPOS_MARTILLO)[number], string> = {
  donut: 'Donut',
  seguridad: 'Seguridad',
  automatico: 'Automático',
}

interface SPTFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sondeoId: string
}

// tipo_martillo arranca sin valor: el Select muestra el placeholder y
// Zod exige elegir uno de los 3 válidos antes de poder enviar.
const emptyValues: Partial<SPTFormValues> = {
  profundidad: 0,
  diametro_mm: 0,
  longitud_varillaje: 0,
  golpes_t1: 0,
  golpes_t2: undefined,
  golpes_t3: undefined,
}

export function SPTFormDialog({ open, onOpenChange, sondeoId }: SPTFormDialogProps) {
  const createMutation = useCreateSPT(sondeoId)

  const form = useForm<SPTFormValues>({
    resolver: zodResolver(sptSchema),
    defaultValues: emptyValues as SPTFormValues,
  })

  useEffect(() => {
    if (open) form.reset(emptyValues)
  }, [open, form])

  async function onSubmit(values: SPTFormValues) {
    try {
      await createMutation.mutateAsync(values)
      toast.success('Ensayo SPT registrado. N y N60 calculados por el servidor.')
      onOpenChange(false)
    } catch {
      toast.error(
        'No se pudo registrar el ensayo. Verificá que el sondeo esté abierto y te pertenezca.'
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo ensayo SPT</DialogTitle>
          <DialogDescription>
            N y N60 se calculan automáticamente al guardar. T1 es el tramo de asiento;
            T2 y T3 son los tramos de 15 cm usados para el conteo.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex gap-2">
              <FormField
                control={form.control}
                name="profundidad"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Profundidad (m) *</FormLabel>
                    <FormControl>
                      <Input type="number" step="any" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tipo_martillo"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Tipo de martillo *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Elegir tipo" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {TIPOS_MARTILLO.map((tipo) => (
                            <SelectItem key={tipo} value={tipo}>
                                {MARTILLO_LABELS[tipo]}
                            </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex gap-2">
              <FormField
                control={form.control}
                name="diametro_mm"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Diámetro (mm) *</FormLabel>
                    <FormControl>
                      <Input type="number" step="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="longitud_varillaje"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Longitud de varillaje (m) *</FormLabel>
                    <FormControl>
                      <Input type="number" step="any" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex gap-2">
              <FormField
                control={form.control}
                name="golpes_t1"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Golpes T1 *</FormLabel>
                    <FormControl>
                      <Input type="number" step="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="golpes_t2"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Golpes T2</FormLabel>
                    <FormControl>
                      <Input type="number" step="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="golpes_t3"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Golpes T3</FormLabel>
                    <FormControl>
                      <Input type="number" step="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Guardando...' : 'Registrar ensayo'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}