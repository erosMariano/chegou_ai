import { PrismaClient, UserRole, PackageStatus } from "@prisma/client"
import * as bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Iniciando Seed do Chegou.AI no PostgreSQL...")

  // Limpeza prévia para idempotência do seed
  await prisma.condominiumAddress.deleteMany()
  await prisma.condominium.deleteMany()
  await prisma.packageEvent.deleteMany()
  await prisma.package.deleteMany()
  await prisma.pushSubscription.deleteMany()
  await prisma.resident.deleteMany()
  await prisma.user.deleteMany()
  await prisma.unit.deleteMany()

  // 0. Criar Condomínio e Endereços Oficiais
  const condo = await prisma.condominium.create({
    data: {
      id: "c0000000-0000-0000-0000-000000000001",
      name: "Condomínio Residencial Jardins do Sol",
      cnpj: "12.345.678/0001-90",
    },
  })

  await prisma.condominiumAddress.createMany({
    data: [
      {
        id: "d0000000-0000-0000-0000-000000000001",
        condominiumId: condo.id,
        label: "Portaria Principal",
        street: "Avenida das Américas",
        number: "1500",
        neighborhood: "Barra da Tijuca",
        city: "Rio de Janeiro",
        state: "RJ",
        zipCode: "22640101",
        addressAliases: ["Av. das Américas", "Av das Americas", "Avenida das Americas"],
        isPrimary: true,
      },
      {
        id: "d0000000-0000-0000-0000-000000000002",
        condominiumId: condo.id,
        label: "Entrada Rua Lateral",
        street: "Rua Jornalista Henrique Cordeiro",
        number: "120",
        neighborhood: "Barra da Tijuca",
        city: "Rio de Janeiro",
        state: "RJ",
        zipCode: "22631450",
        addressAliases: ["R. Jornalista Henrique Cordeiro", "Rua Henrique Cordeiro"],
        isPrimary: false,
      },
    ],
  })
  console.log("✅ Condomínio e 2 Endereços Oficiais criados com sucesso.")

  // 1. Criar Unidades e Moradores para todos os blocos
  const seedBlocksData = [
    // Bloco 6A
    { block: "6A", number: "24", name: "EROS DOS SANTOS MARIANO", email: "erosmariano1@gmail.com", phone: "(11) 95664-9471", doc: "6983" },
    { block: "6A", number: "25", name: "Juliana Moreira", email: "juliana.moreira@email.com", phone: "(11) 98555-6025", doc: "4421" },

    // Bloco A
    { block: "A", number: "101", name: "Lucas Oliveira", email: "lucas.oliveira@email.com", phone: "(11) 98111-1001", doc: "1234" },
    { block: "A", number: "102", name: "Mariana Costa", email: "mariana.costa@email.com", phone: "(11) 98111-1002", doc: "5678" },
    { block: "A", number: "103", name: "Gabriel Santos", email: "gabriel.santos@email.com", phone: "(11) 98111-1003", doc: "9012" },
    { block: "A", number: "104", name: "Juliana Almeida", email: "juliana.almeida@email.com", phone: "(11) 98111-1004", doc: "3456" },
    { block: "A", number: "201", name: "Rodrigo Ferreira", email: "rodrigo.ferreira@email.com", phone: "(11) 98111-2001", doc: "7890" },
    { block: "A", number: "202", name: "Camila Ribeiro", email: "camila.ribeiro@email.com", phone: "(11) 98111-2002", doc: "2345" },

    // Bloco B
    { block: "B", number: "101", name: "Felipe Martins", email: "felipe.martins@email.com", phone: "(11) 98222-1001", doc: "6789" },
    { block: "B", number: "102", name: "Larissa Carvalho", email: "larissa.carvalho@email.com", phone: "(11) 98222-1002", doc: "0123" },
    { block: "B", number: "201", name: "Bruno Lima", email: "bruno.lima@email.com", phone: "(11) 98222-2001", doc: "4567" },
    { block: "B", number: "202", name: "Amanda Rocha", email: "amanda.rocha@email.com", phone: "(11) 98222-2002", doc: "8901" },
    { block: "B", number: "301", name: "Thiago Souza", email: "thiago.souza@email.com", phone: "(11) 98222-3001", doc: "2341" },
    { block: "B", number: "302", name: "Beatriz Gomes", email: "beatriz.gomes@email.com", phone: "(11) 98222-3002", doc: "6782" },
    { block: "B", number: "305", name: "Marcos Vinicius", email: "marcos.vinicius@email.com", phone: "(11) 98222-3005", doc: "4910" },
    { block: "B", number: "402", name: "Mariana Costa Silva", email: "mariana.silva@email.com", phone: "(11) 98222-4002", doc: "8392" },

    // Bloco C
    { block: "C", number: "101", name: "Rafael Barbosa", email: "rafael.barbosa@email.com", phone: "(11) 98333-1001", doc: "1290" },
    { block: "C", number: "102", name: "Fernanda Dias", email: "fernanda.dias@email.com", phone: "(11) 98333-1002", doc: "5634" },
    { block: "C", number: "201", name: "Matheus Castro", email: "matheus.castro@email.com", phone: "(11) 98333-2001", doc: "9078" },
    { block: "C", number: "202", name: "Letícia Moreira", email: "leticia.moreira@email.com", phone: "(11) 98333-2002", doc: "3412" },

    // Bloco D
    { block: "D", number: "101", name: "Gustavo Cardoso", email: "gustavo.cardoso@email.com", phone: "(11) 98444-1001", doc: "7856" },
    { block: "D", number: "102", name: "Natália Teixeira", email: "natalia.teixeira@email.com", phone: "(11) 98444-1002", doc: "2390" },
    { block: "D", number: "201", name: "André Mendes", email: "andre.mendes@email.com", phone: "(11) 98444-2001", doc: "6734" },
    { block: "D", number: "202", name: "Patrícia Freitas", email: "patricia.freitas@email.com", phone: "(11) 98444-2002", doc: "0178" },
  ]

  const defaultPasswordHash = await bcrypt.hash("123456", 10)

  for (const item of seedBlocksData) {
    let unit = await prisma.unit.findFirst({
      where: { block: item.block, number: item.number },
    })

    if (!unit) {
      unit = await prisma.unit.create({
        data: {
          block: item.block,
          number: item.number,
          isActive: true,
        },
      })
    }

    const res = await prisma.resident.create({
      data: {
        unitId: unit.id,
        fullName: item.name,
        email: item.email,
        phone: item.phone,
        documentLast4: item.doc,
        isPrimary: true,
      },
    })

    await prisma.user.create({
      data: {
        name: item.name,
        email: item.email,
        passwordHash: defaultPasswordHash,
        role: UserRole.RESIDENT,
        unitId: unit.id,
        isActive: true,
      },
    })
  }

  console.log(`✅ ${seedBlocksData.length} Unidades e Moradores criados com sucesso em todos os blocos.`)

  // 2. Criar Usuários Operacionais (Síndico e Portaria)
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
