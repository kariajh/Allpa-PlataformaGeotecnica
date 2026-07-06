import { z } from 'zod'

export const dispositivoSchema = z.object({
  device_id: z.string().min(1, 'El device_id es obligatorio'),
  nombre: z.string().min(2, 'El nombre es muy corto'),
  responsable: z.string().min(2, 'El responsable es muy corto'),
  descripcion: z.string().optional().or(z.literal('')),
})

export type DispositivoFormValues = z.infer<typeof dispositivoSchema>