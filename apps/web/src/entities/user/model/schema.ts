import { z } from "zod"

export const UserOperatorSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("E-mail inválido"),
  role: z.enum(["ADMIN", "PORTER", "RESIDENT"]),
  isActive: z.boolean(),
  createdAt: z.string(),
  _count: z
    .object({
      registeredPackages: z.number().optional(),
    })
    .optional(),
})

export type UserOperator = z.infer<typeof UserOperatorSchema>

export const CreateUserFormSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("E-mail institucional inválido"),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
  role: z.enum(["PORTER", "ADMIN"]),
})

export type CreateUserFormData = z.infer<typeof CreateUserFormSchema>

export const UpdateUserFormSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").optional(),
  email: z.string().email("E-mail institucional inválido").optional(),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres").or(z.literal("")).optional(),
  role: z.enum(["PORTER", "ADMIN"]).optional(),
  isActive: z.boolean().optional(),
})

export type UpdateUserFormData = z.infer<typeof UpdateUserFormSchema>
