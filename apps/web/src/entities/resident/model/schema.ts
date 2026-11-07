import { z } from "zod"

export const ResidentSchema = z.object({
  id: z.string().uuid(),
  unitId: z.string().uuid(),
  fullName: z.string().min(2, "Nome completo obrigatório"),
  email: z.string().email("E-mail inválido"),
  documentLast4: z.string().length(4, "Informe os 4 últimos dígitos do documento"),
  isPrimary: z.boolean().default(false),
  createdAt: z.string().datetime().optional(),
})

export type Resident = z.infer<typeof ResidentSchema>

export const PushSubscriptionSchema = z.object({
  id: z.string().uuid(),
  residentId: z.string().uuid(),
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
  userAgent: z.string().optional(),
  isValid: z.boolean().default(true),
  lastUsedAt: z.string().datetime().nullable().optional(),
  createdAt: z.string().datetime().optional(),
})

export type PushSubscription = z.infer<typeof PushSubscriptionSchema>

