import { Unit } from "@/entities/unit/model/types"
import { Resident } from "@/entities/resident/model/types"
import { PackageItem, PackageEvent } from "@/entities/package/model/types"

export const MOCK_UNITS: Unit[] = [
  { id: "8f14e45f-ea9a-4c31-9b2a-112233445566", block: "B", number: "402", isActive: true },
  { id: "1a2b3c4d-5e6f-7a8b-9c0d-111122223333", block: "A", number: "101", isActive: true },
  { id: "2b3c4d5e-6f7a-8b9c-0d1e-222233334444", block: "A", number: "102", isActive: true },
  { id: "3c4d5e6f-7a8b-9c0d-1e2f-333344445555", block: "A", number: "201", isActive: true },
  { id: "4d5e6f7a-8b9c-0d1e-2f3a-444455556666", block: "B", number: "101", isActive: true },
  { id: "5e6f7a8b-9c0d-1e2f-3a4b-555566667777", block: "B", number: "305", isActive: true },
]

export const MOCK_RESIDENTS: Resident[] = [
  {
    id: "3c4d5e6f-7a8b-9c0d-1e2f-3a4b5c6d7e8f",
    unitId: "8f14e45f-ea9a-4c31-9b2a-112233445566", // B - 402
    fullName: "Mariana Costa Silva",
    email: "mariana.silva@email.com",
    documentLast4: "4921",
    isPrimary: true,
  },
  {
    id: "7e8f9a0b-1c2d-3e4f-5a6b-7c8d9e0f1a2b",
    unitId: "1a2b3c4d-5e6f-7a8b-9c0d-111122223333", // A - 101
    fullName: "Carlos Eduardo Menezes",
    email: "carlos.menezes@email.com",
    documentLast4: "1839",
    isPrimary: true,
  },
  {
    id: "9a0b1c2d-3e4f-5a6b-7c8d-9e0f1a2b3c4d",
    unitId: "2b3c4d5e-6f7a-8b9c-0d1e-222233334444", // A - 102
    fullName: "Roberto Sindico Santos",
    email: "roberto.sindico@email.com",
    documentLast4: "7720",
    isPrimary: true,
  },
]

export const INITIAL_PACKAGES: PackageItem[] = [
  {
    id: "d290f1ee-6c54-4b01-90e6-d701748f0851",
    unitId: "8f14e45f-ea9a-4c31-9b2a-112233445566",
    recipientNameRaw: "Mariana Costa Silva",
    trackingCode: "BR26984120984ML",
    carrier: "Mercado Livre",
    pickupPin: "482910",
    pickupQrToken: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    status: "NOTIFIED",
    aiConfidenceScore: 0.94,
    version: 1,
    receivedAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    notifiedAt: new Date(Date.now() - 34 * 60 * 1000).toISOString(),
    unit: { block: "B", number: "402" },
  },
  {
    id: "b381a1bb-5a41-4509-8d77-a8b29c118491",
    unitId: "1a2b3c4d-5e6f-7a8b-9c0d-111122223333",
    recipientNameRaw: "Carlos E. Menezes",
    trackingCode: "AMZ910248102BR",
    carrier: "Amazon Logística",
    pickupPin: "194820",
    pickupQrToken: "b2c3d4e5-f6a7-8901-bcde-fa2345678901",
    status: "RECEIVED",
    aiConfidenceScore: 0.88,
    version: 1,
    receivedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    unit: { block: "A", number: "101" },
  },
  {
    id: "c492b2cc-6b52-4610-9e88-b9c30d229502",
    unitId: "2b3c4d5e-6f7a-8b9c-0d1e-222233334444",
    recipientNameRaw: "Roberto Sindico",
    trackingCode: "NL182901284BR",
    carrier: "Correios (Sedex)",
    pickupPin: "830192",
    pickupQrToken: "c3d4e5f6-a7b8-9012-cdef-ab3456789012",
    status: "DELIVERED",
    aiConfidenceScore: 0.97,
    version: 2,
    receivedAt: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
    notifiedAt: new Date(Date.now() - 118 * 60 * 1000).toISOString(),
    deliveredAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    unit: { block: "A", number: "102" },
  },
]

export const INITIAL_EVENTS: PackageEvent[] = [
  {
    id: "e1-1",
    packageId: "d290f1ee-6c54-4b01-90e6-d701748f0851",
    actorName: "Porteiro José",
    eventType: "CREATED",
    metadata: { carrier: "Mercado Livre", confidence: 0.94 },
    createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
  },
  {
    id: "e1-2",
    packageId: "d290f1ee-6c54-4b01-90e6-d701748f0851",
    actorName: "Worker RabbitMQ",
    eventType: "PUSH_SENT",
    metadata: { channel: "WebPush", resident: "Mariana Costa Silva" },
    createdAt: new Date(Date.now() - 34 * 60 * 1000).toISOString(),
  },
  {
    id: "e3-1",
    packageId: "c492b2cc-6b52-4610-9e88-b9c30d229502",
    actorName: "Porteiro José",
    eventType: "DELIVERED",
    metadata: { verifiedVia: "PIN", resident: "Roberto Sindico" },
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
]

