import { z } from 'zod'
import { TEXTURAS_ESTRATO, CONSISTENCIAS_ESTRATO, HUMEDADES_ESTRATO, TIPOS_MUESTRA } from '@/types'

export const estratoSchema = z
  .object({
    prof_tope: z.coerce.number().min(0, 'No puede ser negativa'),
    prof_base: z.coerce.number().min(0, 'No puede ser negativa'),
    color: z.string().min(1, 'El color es obligatorio'),
    textura: z.enum(TEXTURAS_ESTRATO, { errorMap: () => ({ message: 'Elegí una textura' }) }),
    consistencia: z.enum(CONSISTENCIAS_ESTRATO).optional(),
    humedad: z.enum(HUMEDADES_ESTRATO).optional(),
    descripcion_libre: z.string().optional().or(z.literal('')),
  })
  .refine((v) => v.prof_base > v.prof_tope, {
    message: 'La profundidad base debe ser mayor a la tope',
    path: ['prof_base'],
  })

export type EstratoFormValues = z.infer<typeof estratoSchema>

export const muestraSchema = z.object({
  tipo: z.enum(TIPOS_MUESTRA, { errorMap: () => ({ message: 'Elegí un tipo' }) }),
  profundidad: z.coerce.number().min(0, 'No puede ser negativa'),
  diametro_mm: z.coerce.number().int().positive().optional(),
  recuperacion_pct: z.coerce.number().min(0).max(100).optional(),
})

export type MuestraFormValues = z.infer<typeof muestraSchema>