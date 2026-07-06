import { z } from 'zod'
import { TIPOS_SONDEO } from '@/types'

export const sondeoSchema = z.object({
  codigo: z.string().min(1, 'El código es obligatorio').max(50, 'Máximo 50 caracteres'),
  tipo: z.enum(TIPOS_SONDEO, { errorMap: () => ({ message: 'Elegí un tipo válido' }) }),
  latitud: z.coerce.number().min(-90, 'Latitud inválida').max(90, 'Latitud inválida'),
  longitud: z.coerce.number().min(-180, 'Longitud inválida').max(180, 'Longitud inválida'),
  cota: z.coerce.number().optional(),
  profundidad_total: z.coerce.number().optional(),
})

export type SondeoFormValues = z.infer<typeof sondeoSchema>