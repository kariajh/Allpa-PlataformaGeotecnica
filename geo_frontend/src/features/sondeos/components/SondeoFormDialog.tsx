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

import { sondeoSchema, type SondeoFormValues } from '../schema'
import { TIPOS_SONDEO } from '@/types'

const TIPO_LABELS: Record<(typeof TIPOS_SONDEO)[number], string> = {
  perforacion: 'Perforación',
  calicata: 'Calicata',
  cpt: 'CPT',
  vane_shear: 'Vane Shear',
}
import { useCreateSondeo } from '@/hooks/useSondeos'

interface SondeoFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  proyectoId: string
}

const emptyValues: SondeoFormValues = {
  codigo: '',
  tipo: undefined as unknown as SondeoFormValues['tipo'],
  latitud: 0,
  longitud: 0,
  cota: undefined,
  profundidad_total: undefined,
}

export function SondeoFormDialog({ open, onOpenChange, proyectoId }: SondeoFormDialogProps) {
  const createMutation = useCreateSondeo(proyectoId)

  const form = useForm<SondeoFormValues>({
    resolver: zodResolver(sondeoSchema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (open) form.reset(emptyValues)
  }, [open, form])

  async function onSubmit(values: SondeoFormValues) {
    try {
      await createMutation.mutateAsync(values)
      toast.success('Sondeo creado')
      onOpenChange(false)
    } catch {
      toast.error('No se pudo crear el sondeo. Revisá la conexión con el backend.')
    }
  }

  // Usa la geolocalización del navegador/dispositivo para completar
  // lat/lon automáticamente — tiene sentido en una app de captura de
  // campo, evita tipear coordenadas a mano en el celular.
  function usarUbicacionActual() {
    if (!navigator.geolocation) {
      toast.error('Este dispositivo no soporta geolocalización')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        form.setValue('latitud', pos.coords.latitude, { shouldValidate: true })
        form.setValue('longitud', pos.coords.longitude, { shouldValidate: true })
        toast.success('Ubicación capturada')
      },
      () => toast.error('No se pudo obtener la ubicación. Revisá los permisos del navegador.')
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo sondeo</DialogTitle>
          <DialogDescription>Cargá los datos del sondeo con sus coordenadas GPS.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="codigo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: S-01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tipo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: perforacion" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-end gap-2">
              <FormField
                control={form.control}
                name="latitud"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Latitud *</FormLabel>
                    <FormControl>
                      <Input type="number" step="any" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="longitud"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Longitud *</FormLabel>
                    <FormControl>
                      <Input type="number" step="any" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="button" variant="outline" onClick={usarUbicacionActual}>
                Usar GPS
              </Button>
            </div>

            <div className="flex gap-2">
              <FormField
                control={form.control}
                name="cota"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Cota</FormLabel>
                    <FormControl>
                      <Input type="number" step="any" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="profundidad_total"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Profundidad total</FormLabel>
                    <FormControl>
                      <Input type="number" step="any" {...field} />
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
                {createMutation.isPending ? 'Guardando...' : 'Crear sondeo'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}