import { z } from 'zod'
import { TIPOS_MARTILLO } from '@/types'

export const sptSchema = z.object({
  profundidad: z.coerce.number().min(0, 'La profundidad no puede ser negativa'),
  tipo_martillo: z.enum(TIPOS_MARTILLO, {
    errorMap: () => ({ message: 'Elegí un tipo de martillo válido' }),
  }),
  diametro_mm: z.coerce.number().int('Debe ser un número entero').positive('Debe ser mayor a 0'),
  longitud_varillaje: z.coerce.number().positive('Debe ser mayor a 0'),
  golpes_t1: z.coerce.number().int('Debe ser un número entero').min(0),
  golpes_t2: z.coerce.number().int('Debe ser un número entero').min(0).optional(),
  golpes_t3: z.coerce.number().int('Debe ser un número entero').min(0).optional(),
})
 
export type SPTFormValues = z.infer<typeof sptSchema>