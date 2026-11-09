import { PrismaClient } from "@prisma/client"
import Redis from "ioredis"
import * as dotenv from "dotenv"
import * as path from "path"

// Carrega variáveis do arquivo .env
dotenv.config({ path: path.resolve(__dirname, "../.env") })
dotenv.config({ path: path.resolve(__dirname, "../../.env") })

const prisma = new PrismaClient()

async function main() {
  console.log("\n================================================================================")
  console.log("🧹 [Chegou.AI] RESET TOTAL DO BANCO DE DADOS E REDIS (DO ZERO)")
  console.log("================================================================================\n")

  console.log("1. Conectando e limpando tabelas do PostgreSQL...")

  // 1. Apaga dados em ordem estrita de chaves estrangeiras (Foreign Keys)
  const delEvents = await prisma.packageEvent.deleteMany()
  console.log(`   - package_events: ${delEvents.count} registros removidos.`)

  const delPackages = await prisma.package.deleteMany()
  console.log(`   - packages: ${delPackages.count} registros removidos.`)

  const delPush = await prisma.pushSubscription.deleteMany()
  console.log(`   - push_subscriptions: ${delPush.count} registros removidos.`)

  const delResidents = await prisma.resident.deleteMany()
  console.log(`   - residents: ${delResidents.count} registros removidos.`)

  const delUsers = await prisma.user.deleteMany()
  console.log(`   - users: ${delUsers.count} registros removidos.`)

  const delUnits = await prisma.unit.deleteMany()
  console.log(`   - units: ${delUnits.count} registros removidos.`)

  const delAddresses = await prisma.condominiumAddress.deleteMany()
  console.log(`   - condominium_addresses: ${delAddresses.count} registros removidos.`)

  const delCondos = await prisma.condominium.deleteMany()
  console.log(`   - condominiums: ${delCondos.count} registros removidos.`)

  console.log("\n2. Conectando e limpando o cache e chaves do Redis...")

  const redisUrl = process.env.REDIS_URL || "redis://localhost:6379"
  const redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 2,
    connectTimeout: 5000,
  })

  try {
    const keysBefore = await redis.dbsize()
    await redis.flushdb()
    console.log(`   - Redis (${redisUrl}): ${keysBefore} chaves excluídas (FLUSHDB executado com sucesso).`)
  } catch (err: any) {
    console.warn(`   ⚠️ Aviso ao limpar Redis: ${err.message}`)
  } finally {
    redis.disconnect()
  }

  console.log("\n================================================================================")
  console.log("✅ BANCO DE DADOS E REDIS 100% ZERADOS COM SUCESSO!")
  console.log("================================================================================")
  console.log("O Chegou.AI agora está limpo e pronto para iniciar um novo condomínio do zero:")
  console.log("1. Inicie a API:       npm --prefix apps/api run start:dev")
  console.log("2. Setup do 1º Síndico: POST http://localhost:8080/api/v1/auth/setup-initial-admin")
  console.log("3. Swagger interativo:  http://localhost:8080/api/docs\n")
}

main()
  .catch((err) => {
    console.error("❌ Erro ao zerar banco:", err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

