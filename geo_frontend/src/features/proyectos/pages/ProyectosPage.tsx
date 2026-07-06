import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

import { ProyectoFormDialog } from '../components/ProyectoFormDialog'
import { useProyectosQuery, useDeleteProyecto } from '@/hooks/useProyectos'
import type { Proyecto } from '@/types'

export default function ProyectosPage() {
  const { data: proyectos, isLoading, isError } = useProyectosQuery()
  const deleteMutation = useDeleteProyecto()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProyecto, setEditingProyecto] = useState<Proyecto | null>(null)

  function handleNuevo() {
    setEditingProyecto(null)
    setDialogOpen(true)
  }

  function handleEditar(proyecto: Proyecto) {
    setEditingProyecto(proyecto)
    setDialogOpen(true)
  }

  async function handleEliminar(proyecto: Proyecto) {
    const confirmado = window.confirm(`¿Eliminar el proyecto "${proyecto.nombre}"?`)
    if (!confirmado) return

    try {
      await deleteMutation.mutateAsync(proyecto.id)
      toast.success('Proyecto eliminado')
    } catch {
      toast.error('No se pudo eliminar. Revisá la conexión con el backend.')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Proyectos</h1>
          <p className="text-sm text-muted-foreground">
            {proyectos?.length ?? 0} proyecto(s) registrado(s)
          </p>
        </div>
        <Button onClick={handleNuevo}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo proyecto
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading && (
            <p className="text-sm text-muted-foreground p-6">Cargando proyectos...</p>
          )}

          {isError && (
            <p className="text-sm text-destructive p-6">
              No se pudo conectar con el backend. Verificá que esté corriendo en localhost:8000.
            </p>
          )}

          {!isLoading && !isError && proyectos?.length === 0 && (
            <p className="text-sm text-muted-foreground p-6">
              Todavía no hay proyectos. Creá el primero con el botón de arriba.
            </p>
          )}

          {!isLoading && !isError && proyectos && proyectos.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Responsable</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {proyectos.map((proyecto) => (
                  <TableRow key={proyecto.id}>
                    <TableCell className="font-medium">{proyecto.nombre}</TableCell>
                    <TableCell>{proyecto.cliente}</TableCell>
                    <TableCell>{proyecto.responsable}</TableCell>
                    <TableCell>{proyecto.ubicacion || '—'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{proyecto.sync_status}</Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEditar(proyecto)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEliminar(proyecto)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ProyectoFormDialog open={dialogOpen} onOpenChange={setDialogOpen} proyecto={editingProyecto} />
    </div>
  )
}