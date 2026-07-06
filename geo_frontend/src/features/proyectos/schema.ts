import { z } from 'zod'

export const proyectoSchema = z.object({
  nombre: z.string().min(2, 'El nombre es muy corto').max(120, 'Máximo 120 caracteres'),
  cliente: z.string().min(2, 'El cliente es muy corto').max(120, 'Máximo 120 caracteres'),
  responsable: z.string().min(2, 'El responsable es muy corto').max(120, 'Máximo 120 caracteres'),
  ubicacion: z.string().max(200, 'Máximo 200 caracteres').optional().or(z.literal('')),
  fecha_inicio: z.string().optional().or(z.literal('')),
})

export type ProyectoFormValues = z.infer<typeof proyectoSchema>