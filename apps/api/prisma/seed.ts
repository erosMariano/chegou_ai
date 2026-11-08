import { PrismaClient, UserRole, PackageStatus } from "@prisma/client"
import * as bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Iniciando Seed do Chegou.AI no PostgreSQL...")

  // Limpeza prévia para idempotência do seed
  await prisma.packageEvent.deleteMany()
  await prisma.package.deleteMany()
  await prisma.pushSubscription.deleteMany()
  await prisma.resident.deleteMany()
  await prisma.user.deleteMany()
  await prisma.unit.deleteMany()

  // 1. Criar Unidades
  const unitB402 = await prisma.unit.create({
    data: {
      id: "8f14e45f-ea9a-4c31-9b2a-112233445566",
      block: "B",
      number: "402",
      isActive: true,
    },
  })

  const unitA101 = await prisma.unit.create({
    data: {
      id: "1a2b3c4d-5e6f-7a8b-9c0d-111122223333",
      block: "A",
      number: "101",
      isActive: true,
    },
  })

  const unitA102 = await prisma.unit.create({
    data: {
      id: "2b3c4d5e-6f7a-8b9c-0d1e-222233334444",
      block: "A",
      number: "102",
      isActive: true,
    },
  })

  const unitA201 = await prisma.unit.create({
    data: {
      id: "3c4d5e6f-7a8b-9c0d-1e2f-333344445555",
      block: "A",
      number: "201",
      isActive: true,
    },
  })

  const unitB101 = await prisma.unit.create({
    data: {
      id: "4d5e6f7a-8b9c-0d1e-2f3a-444455556666",
      block: "B",
      number: "101",
      isActive: true,
    },
  })

  const unitB305 = await prisma.unit.create({
    data: {
      id: "5e6f7a8b-9c0d-1e2f-3a4b-555566667777",
      block: "B",
      number: "305",
      isActive: true,
    },
  })

  console.log("✅ 6 Unidades criadas com sucesso.")

  // 2. Criar Moradores (com telefone e máscara LGPD)
  const resMariana = await prisma.resident.create({
    data: {
      id: "3c4d5e6f-7a8b-9c0d-1e2f-3a4b5c6d7e8f",
      unitId: unitB402.id,
      fullName: "Mariana Costa Silva",
      email: "mariana.silva@email.com",
      phone: "(11) 98765-4321",
      documentLast4: "4921",
      isPrimary: true,
    },
  })

  const resCarlos = await prisma.resident.create({
    data: {
      id: "7e8f9a0b-1c2d-3e4f-5a6b-7c8d9e0f1a2b",
      unitId: unitA101.id,
      fullName: "Carlos Eduardo Menezes",
      email: "carlos.menezes@email.com",
      phone: "(11) 99123-8877",
      documentLast4: "1839",
      isPrimary: true,
    },
  })

  const resRoberto = await prisma.resident.create({
    data: {
      id: "9a0b1c2d-3e4f-5a6b-7c8d-9e0f1a2b3c4d",
      unitId: unitA102.id,
      fullName: "Roberto Sindico Santos",
      email: "roberto.sindico@email.com",
      phone: "(11) 97444-1029",
      documentLast4: "7720",
      isPrimary: true,
    },
  })

  console.log("✅ 3 Moradores criados com sucesso.")

  // 3. Criar Usuários Operacionais
  const defaultPasswordHash = await bcrypt.hash("123456", 10)

  const userAdmin = await prisma.user.create({
    data: {
      id: "a0000000-0000-0000-0000-000000000001",
      name: "Roberto Almeida (Síndico)",
      email: "sindico@chegou.ai",
      passwordHash: defaultPasswordHash,
      role: UserRole.ADMIN,
      isActive: true,
    },
  })

  const userPorter = await prisma.user.create({
    data: {
      id: "b0000000-0000-0000-0000-000000000002",
      name: "Carlos Silva (Porteiro)",
      email: "porteiro@chegou.ai",
      passwordHash: defaultPasswordHash,
      role: UserRole.PORTER,
      isActive: true,
    },
  })

  const userResident = await prisma.user.create({
    data: {
      id: "c0000000-0000-0000-0000-000000000003",
      name: "Mariana Costa (Moradora)",
      email: "mariana@chegou.ai",
      passwordHash: defaultPasswordHash,
      role: UserRole.RESIDENT,
      unitId: unitB402.id,
      isActive: true,
    },
  })

  console.log("✅ 3 Usuários (Admin, Porter, Resident) criados.")

  // 4. Criar Encomendas Iniciais com PIN e QR Tokens
  const pin1Hash = await bcrypt.hash("482910", 10)
  const pin2Hash = await bcrypt.hash("194820", 10)
  const pin3Hash = await bcrypt.hash("830192", 10)

  const pkg1 = await prisma.package.create({
    data: {
      id: "d290f1ee-6c54-4b01-90e6-d701748f0851",
      unitId: unitB402.id,
      registeredByUserId: userPorter.id,
      recipientNameRaw: "Mariana Costa Silva",
      trackingCode: "BR26984120984ML",
      carrier: "Mercado Livre",
      pickupPin: "482910",
      pickupPinHash: pin1Hash,
      pickupQrToken: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      status: PackageStatus.NOTIFIED,
      aiConfidenceScore: 0.94,
      version: 1,
      receivedAt: new Date(Date.now() - 35 * 60 * 1000),
      notifiedAt: new Date(Date.now() - 34 * 60 * 1000),
    },
  })

  const pkg2 = await prisma.package.create({
    data: {
      id: "b381a1bb-5a41-4509-8d77-a8b29c118491",
      unitId: unitA101.id,
      registeredByUserId: userPorter.id,
      recipientNameRaw: "Carlos E. Menezes",
      trackingCode: "AMZ910248102BR",
      carrier: "Amazon Logística",
      pickupPin: "194820",
      pickupPinHash: pin2Hash,
      pickupQrToken: "b2c3d4e5-f6a7-8901-bcde-fa2345678901",
      status: PackageStatus.RECEIVED,
      aiConfidenceScore: 0.88,
      version: 1,
      receivedAt: new Date(Date.now() - 10 * 60 * 1000),
    },
  })

  const pkg3 = await prisma.package.create({
    data: {
      id: "c492b2cc-6b52-4610-9e88-b9c30d229502",
      unitId: unitA102.id,
      registeredByUserId: userPorter.id,
      deliveredToResidentId: resRoberto.id,
      recipientNameRaw: "Roberto Sindico",
      trackingCode: "NL182901284BR",
      carrier: "Correios (Sedex)",
      pickupPin: "830192",
      pickupPinHash: pin3Hash,
      pickupQrToken: "c3d4e5f6-a7b8-9012-cdef-ab3456789012",
      status: PackageStatus.DELIVERED,
      aiConfidenceScore: 0.97,
      version: 2,
      receivedAt: new Date(Date.now() - 120 * 60 * 1000),
      notifiedAt: new Date(Date.now() - 118 * 60 * 1000),
      deliveredAt: new Date(Date.now() - 15 * 60 * 1000),
    },
  })

  // 5. Trilha de Auditoria Inicial
  await prisma.packageEvent.createMany({
    data: [
      {
        packageId: pkg1.id,
        actorUserId: userPorter.id,
        eventType: "CREATED",
        metadata: { carrier: "Mercado Livre", method: "AI_SCAN" },
        createdAt: new Date(Date.now() - 35 * 60 * 1000),
      },
      {
        packageId: pkg1.id,
        eventType: "PUSH_SENT",
        metadata: { residentId: resMariana.id, success: true },
        createdAt: new Date(Date.now() - 34 * 60 * 1000),
      },
      {
        packageId: pkg2.id,
        actorUserId: userPorter.id,
        eventType: "CREATED",
        metadata: { carrier: "Amazon Logística", method: "MANUAL" },
        createdAt: new Date(Date.now() - 10 * 60 * 1000),
      },
      {
        packageId: pkg3.id,
        actorUserId: userPorter.id,
        eventType: "CREATED",
        metadata: { carrier: "Correios (Sedex)" },
        createdAt: new Date(Date.now() - 120 * 60 * 1000),
      },
      {
        packageId: pkg3.id,
        actorUserId: userPorter.id,
        eventType: "DELIVERED",
        metadata: { method: "PIN", residentId: resRoberto.id },
        createdAt: new Date(Date.now() - 15 * 60 * 1000),
      },
    ],
  })

  console.log("✅ 3 Encomendas e 5 Eventos de Auditoria criados.")
  console.log("🚀 Seed concluído com sucesso!")
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
