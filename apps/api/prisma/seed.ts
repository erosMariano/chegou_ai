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

  // 2. Criar Usuários Operacionais (Apenas Síndico e Portaria)
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

  console.log("✅ 2 Usuários operacionais criados (Síndico e Portaria).")
  console.log("✨ Banco limpo: 0 moradores e 0 encomendas.")
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
