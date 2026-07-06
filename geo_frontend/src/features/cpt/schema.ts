import { z } from 'zod'

export const lecturaCPTSchema = z.object({
  profundidad: z.coerce.number().min(0, 'No puede ser negativa'),
  qc: z.coerce.number().min(0, 'No puede ser negativo'),
  fs: z.coerce.number().min(0, 'No puede ser negativo'),
})

export const cptBatchSchema = z.object({
  lecturas: z.array(lecturaCPTSchema).min(1, 'Cargá al menos una lectura'),
})

export type CPTBatchFormValues = z.infer<typeof cptBatchSchema>