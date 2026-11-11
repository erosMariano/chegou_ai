import { z } from "zod"

/**
 * Schema Zod SDD para o onboarding inicial de criação do condomínio + síndico administrador.
 * Espelha exatamente os contratos do endpoint POST /api/v1/auth/setup-initial-admin.
 */
export const SetupCondominiumSchema = z
  .object({
    condominiumName: z
      .string()
      .trim()
      .min(2, "Informe o nome do condomínio.")
      .max(150, "Nome do condomínio deve ter no máximo 150 caracteres."),
    cnpj: z
      .string()
      .trim()
      .max(18, "CNPJ deve ter no máximo 18 caracteres.")
      .optional()
      .or(z.literal("")),
    name: z
      .string()
      .trim()
      .min(2, "Informe o nome completo do síndico ou administrador.")
      .max(150, "Nome deve ter no máximo 150 caracteres."),
    email: z
      .string()
      .trim()
      .email("Informe um e-mail válido para o acesso administrativo.")
      .max(150, "E-mail deve ter no máximo 150 caracteres."),
    password: z
      .string()
      .min(6, "A senha deve ter no mínimo 6 caracteres.")
      .max(100, "A senha deve ter no máximo 100 caracteres."),
    confirmPassword: z.string().min(1, "Confirme sua senha."),
    zipCode: z
      .string()
      .trim()
      .refine((val) => val.replace(/\D/g, "").length === 8, {
        message: "Informe um CEP válido com 8 dígitos.",
      }),
    street: z.string().trim().min(2, "Informe o logradouro (ou busque pelo CEP).").max(200),
    number: z.string().trim().min(1, "Informe o número predial.").max(20),
    neighborhood: z.string().trim().min(2, "Informe o bairro.").max(100),
    city: z.string().trim().min(2, "Informe a cidade.").max(100),
    state: z
      .string()
      .trim()
      .length(2, "A UF deve conter 2 letras (ex: SP, RJ)."),
    addressLabel: z.string().trim().max(100).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas digitadas não coincidem.",
    path: ["confirmPassword"],
  })

export type SetupCondominiumFormData = z.infer<typeof SetupCondominiumSchema>

