import { z } from "zod"

export const UnitSchema = z.object({
  id: z.string().uuid(),
  block: z.string().min(1, "Bloco obrigatório"),
  number: z.string().min(1, "Número do apartamento obrigatório"),
  isActive: z.boolean().default(true),
  createdAt: z.string().datetime().optional(),
})

export type Unit = z.infer<typeof UnitSchema>

