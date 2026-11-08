import { z } from "zod"

export const PackageStatusEnum = z.enum([
  "RECEIVED",
  "NOTIFIED",
  "NOTIFICATION_FAILED",
  "DELIVERED",
  "CANCELLED",
])

export type PackageStatus = z.infer<typeof PackageStatusEnum>

export const ExtractedLabelSchema = z.object({
  recipientName: z.string().nullable().optional().default(""),
  unitBlock: z.string().nullable().optional().default(""),
  unitNumber: z.string().nullable().optional().default(""),
  trackingCode: z.string().nullable().optional().default(""),
  carrier: z.string().nullable().optional().default(""),
  extractedStreet: z.string().nullable().optional().default(""),
  extractedNumber: z.string().nullable().optional().default(""),
  extractedZipCode: z.string().nullable().optional().default(""),
  extractedCity: z.string().nullable().optional().default(""),
  uncertaintyReason: z.string().nullable().optional(),
})

export const AddressValidationSchema = z.object({
  isMatch: z.boolean().nullable(),
  matchedAddressLabel: z.string().optional(),
  mismatchReason: z.string().optional(),
})

export type AddressValidation = z.infer<typeof AddressValidationSchema>

export const ExtractLabelResponseSchema = z.object({
  extracted: ExtractedLabelSchema,
  matchedUnitId: z.string().uuid().nullable().optional(),
  confidenceScore: z.number().min(0).max(1),
  requiresReview: z.boolean(),
  processingTimeMs: z.number(),
  addressValidation: AddressValidationSchema.optional(),
})

export type ExtractLabelResponse = z.infer<typeof ExtractLabelResponseSchema>

export const CheckinFormSchema = z.object({
  unitId: z.string().min(1, "Selecione uma unidade cadastrada"),
  recipientNameRaw: z.string().min(2, "Nome do destinatário deve ter pelo menos 2 caracteres"),
  trackingCode: z.string(),
  carrier: z.string(),
  aiConfidenceScore: z.number().min(0).max(1).nullable().optional(),
})

export type CheckinFormData = z.infer<typeof CheckinFormSchema>

export const CheckoutFormSchema = z.object({
  code: z.string().min(6, "PIN de 6 dígitos ou QR Token"),
  codeType: z.enum(["PIN", "QR"]).default("PIN"),
  residentId: z.string().uuid().optional(),
})

export type CheckoutFormData = z.infer<typeof CheckoutFormSchema>

export const PackageEventSchema = z.object({
  id: z.string().uuid(),
  packageId: z.string().uuid(),
  actorUserId: z.string().uuid().nullable().optional(),
  actorName: z.string().optional(),
  eventType: z.enum(["CREATED", "PUSH_SENT", "PUSH_FAILED", "DELIVERED", "CANCELLED"]),
  metadata: z.record(z.string(), z.unknown()).default({}),
  createdAt: z.string(),
})

export type PackageEvent = z.infer<typeof PackageEventSchema>

export const PackageSchema = z.object({
  id: z.string().uuid(),
  unitId: z.string().uuid(),
  registeredByUserId: z.string().uuid().optional(),
  deliveredToResidentId: z.string().uuid().nullable().optional(),
  recipientNameRaw: z.string(),
  trackingCode: z.string().optional().default(""),
  carrier: z.string().optional().default(""),
  pickupPin: z.string().optional().default(""),
  pickupPinHash: z.string().optional(),
  pickupQrToken: z.string().uuid(),
  status: PackageStatusEnum,
  aiConfidenceScore: z.number().nullable().optional(),
  version: z.number().default(1),
  receivedAt: z.string(),
  notifiedAt: z.string().nullable().optional(),
  deliveredAt: z.string().nullable().optional(),
  unit: z
    .object({
      block: z.string(),
      number: z.string(),
    })
    .optional(),
  events: z.array(PackageEventSchema).optional(),
})

export type PackageItem = z.infer<typeof PackageSchema>
