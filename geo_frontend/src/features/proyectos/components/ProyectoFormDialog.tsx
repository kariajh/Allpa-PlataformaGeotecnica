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

import { proyectoSchema, type ProyectoFormValues } from '../schema'
import { useCreateProyecto, useUpdateProyecto } from '@/hooks/useProyectos'
import type { Proyecto } from '@/types'

interface ProyectoFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  proyecto?: Proyecto | null
}

const emptyValues: ProyectoFormValues = {
  nombre: '', 
  cliente: '',
  responsable: '',
  ubicacion: '',
  fecha_inicio: '',
}

export function ProyectoFormDialog({ open, onOpenChange, proyecto }: ProyectoFormDialogProps) {
  const isEditing = Boolean(proyecto)
  const createMutation = useCreateProyecto()
  const updateMutation = useUpdateProyecto()
  const isSaving = createMutation.isPending || updateMutation.isPending

  const form = useForm<ProyectoFormValues>({
    resolver: zodResolver(proyectoSchema),
    defaultValues: emptyValues,
  })

  // Cada vez que se abre el dialog (o cambia el proyecto a editar) resetea
  // el formulario: con los valores del proyecto si es edición, o vacío si
  // es alta.
  useEffect(() => {
    if (open) {
      form.reset(
        proyecto
          ? {
              nombre: proyecto.nombre,
              cliente: proyecto.cliente,
              responsable: proyecto.responsable,
              ubicacion: proyecto.ubicacion ?? '',
              fecha_inicio: proyecto.fecha_inicio ?? '',
            }
          : emptyValues
      )
    }
  }, [open, proyecto, form])

  async function onSubmit(values: ProyectoFormValues) {
    try {
      if (isEditing && proyecto) {
        await updateMutation.mutateAsync({ id: proyecto.id, data: values })
        toast.success('Proyecto actualizado')
      } else {
        await createMutation.mutateAsync(values)
        toast.success('Proyecto creado')
      }
      onOpenChange(false)
    } catch {
      toast.error('No se pudo guardar el proyecto. Revisá la conexión con el backend.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar proyecto' : 'Nuevo proyecto'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Modificá los datos del proyecto.'
              : 'Cargá los datos básicos para crear el proyecto.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Edificio Costanera" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cliente"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Constructora del Sur" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="responsable"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Responsable *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Ing. Karina Pérez" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ubicacion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ubicación</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Viedma, Río Negro" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fecha_inicio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha de inicio</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear proyecto'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}