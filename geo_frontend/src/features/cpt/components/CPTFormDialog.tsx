import { useEffect } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'

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
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

import { cptBatchSchema, type CPTBatchFormValues } from '../schema'
import { useCreateCPTManual } from '@/hooks/useCPT'

interface CPTFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sondeoId: string
}

const filaVacia = { profundidad: 0, qc: 0, fs: 0 }
const emptyValues: CPTBatchFormValues = { lecturas: [filaVacia] }

export function CPTFormDialog({ open, onOpenChange, sondeoId }: CPTFormDialogProps) {
  const createMutation = useCreateCPTManual(sondeoId)

  const form = useForm<CPTBatchFormValues>({
    resolver: zodResolver(cptBatchSchema),
    defaultValues: emptyValues,
  })
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'lecturas' })

  useEffect(() => {
    if (open) form.reset(emptyValues)
  }, [open, form])

  async function onSubmit(values: CPTBatchFormValues) {
    try {
      const creadas = await createMutation.mutateAsync(values.lecturas)
      toast.success(`${creadas.length} lectura(s) CPT registrada(s). Rf calculado por el servidor.`)
      onOpenChange(false)
    } catch {
      toast.error('No se pudieron registrar las lecturas. Revisá la conexión con el backend.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Carga manual de lecturas CPT</DialogTitle>
          <DialogDescription>
            Rf se calcula automáticamente (Rf = fs/qc×100). Agregá una fila por cada
            profundidad medida.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 text-xs font-medium text-muted-foreground px-1">
              <span>Profundidad (m)</span>
              <span>qc</span>
              <span>fs</span>
              <span />
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-start">
                  <FormField
                    control={form.control}
                    name={`lecturas.${index}.profundidad`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input type="number" step="any" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`lecturas.${index}.qc`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input type="number" step="any" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`lecturas.${index}.fs`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input type="number" step="any" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => fields.length > 1 && remove(index)}
                    disabled={fields.length === 1}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append(filaVacia)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar fila
            </Button>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Guardando...' : `Registrar ${fields.length} lectura(s)`}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}