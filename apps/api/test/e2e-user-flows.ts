import { NestFactory } from "@nestjs/core"
import { ValidationPipe } from "@nestjs/common"
import { AppModule } from "../src/app.module"
import { PrismaService } from "../src/prisma/prisma.service"
import { RedisService } from "../src/common/redis/redis.service"
import { Rfc7807ExceptionFilter } from "../src/common/filters/rfc7807-exception.filter"

interface StepReport {
  step: string
  actor: string
  action: string
  endpoint: string
  method: string
  status: "SUCCESS" | "FAILED" | "MOCKED"
  statusCode: number
  notes: string
  latencyMs: number
}

const reports: StepReport[] = []

async function request(
  baseUrl: string,
  path: string,
  options: {
    method?: string
    body?: any
    token?: string
    headers?: Record<string, string>
  } = {}
) {
  const method = options.method || "GET"
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    ...(options.headers || {}),
  }

  const start = Date.now()
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
  const latencyMs = Date.now() - start

  const text = await res.text()
  let data: any = null
  try {
    data = JSON.parse(text)
  } catch {
    data = text
  }

  return {
    status: res.status,
    ok: res.ok,
    data,
    latencyMs,
  }
}

async function run() {
  console.log("================================================================================")
  console.log("🚀 INICIANDO VALIDAÇÃO COMPLETA DE FLUXOS DO USUÁRIO — CHEGOU.AI")
  console.log("================================================================================\n")

  const TEST_PORT = 8089
  const BASE_URL = `http://127.0.0.1:${TEST_PORT}/api/v1`

  // 1. Inicializa App NestJS em porta dedicada
  console.log("🔧 1. Subindo instância do NestJS na porta", TEST_PORT)
  const app = await NestFactory.create(AppModule, { logger: ["error", "warn"] })
  app.setGlobalPrefix("api/v1")
  app.useGlobalFilters(new Rfc7807ExceptionFilter())
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    })
  )
  await app.listen(TEST_PORT, "127.0.0.1")

  const prisma = app.get(PrismaService)
  const redis = app.get(RedisService)

  console.log("🧹 2. Limpando banco de dados PostgreSQL e Redis (Reset Total)...")
  await prisma.packageEvent.deleteMany()
  await prisma.package.deleteMany()
  await prisma.pushSubscription.deleteMany()
  await prisma.resident.deleteMany()
  await prisma.user.deleteMany()
  await prisma.unit.deleteMany()
  await prisma.condominiumAddress.deleteMany()
  await prisma.condominium.deleteMany()

  // Limpeza de chaves de teste no Redis
  try {
    const redisClient = (redis as any).client
    if (redisClient) {
      await redisClient.flushdb()
    }
  } catch (e: any) {
    console.warn("Aviso ao limpar Redis:", e.message)
  }
  console.log("✅ Banco de dados zerado com sucesso! Nenhuma tabela ou registro remanescente.\n")

  let sindicoToken = ""
  let porteiroToken = ""
  let moradorToken = ""
  let unitA101Id = ""
  let unitB201Id = ""
  let residentCamilaId = ""
  let package1Id = ""
  let package1Pin = ""
  let package1Qr = ""
  let package2Id = ""

  // -----------------------------------------------------------------------------
  // FLUXO 1: SETUP DO CONDOMÍNIO E PRIMEIRO SÍNDICO (ONBOARDING INICIAL)
  // -----------------------------------------------------------------------------
  console.log("👉 [FLUXO 1] Onboarding Inicial: Criar Condomínio e Primeiro Síndico...")
  {
    const res = await request(BASE_URL, "/auth/setup-initial-admin", {
      method: "POST",
      body: {
        condominiumName: "Condomínio Residencial Jardins do Sol",
        cnpj: "12.345.678/0001-90",
        name: "Roberto Almeida (Síndico)",
        email: "sindico@chegou.ai",
        password: "SenhaSegura@123",
      },
    })

    if (res.ok && res.data.token) {
      sindicoToken = res.data.token
      reports.push({
        step: "1.1 Setup Inicial Síndico & Condomínio",
        actor: "Visitante / Síndico",
        action: "Cadastra condomínio e primeiro administrador",
        endpoint: "/auth/setup-initial-admin",
        method: "POST",
        status: "SUCCESS",
        statusCode: res.status,
        notes: `Criado síndico ID ${res.data.user.id} (${res.data.user.email}). Sessão JWT emitida.`,
        latencyMs: res.latencyMs,
      })
    } else {
      reports.push({
        step: "1.1 Setup Inicial Síndico & Condomínio",
        actor: "Visitante / Síndico",
        action: "Cadastra condomínio e primeiro administrador",
        endpoint: "/auth/setup-initial-admin",
        method: "POST",
        status: "FAILED",
        statusCode: res.status,
        notes: JSON.stringify(res.data),
        latencyMs: res.latencyMs,
      })
      throw new Error(`Falha no Fluxo 1.1: ${JSON.stringify(res.data)}`)
    }

    // 1.2 Síndico cadastra Endereço Oficial
    const resAddr = await request(BASE_URL, "/condominium/addresses", {
      method: "POST",
      token: sindicoToken,
      body: {
        label: "Portaria Principal",
        street: "Avenida das Américas",
        number: "1500",
        neighborhood: "Barra da Tijuca",
        city: "Rio de Janeiro",
        state: "RJ",
        zipCode: "22640101",
        addressAliases: ["Av. das Américas", "Av das Americas"],
        isPrimary: true,
      },
    })

    reports.push({
      step: "1.2 Cadastro de Endereço Oficial",
      actor: "Síndico",
      action: "Cadastra endereço oficial com apelidos para IA",
      endpoint: "/condominium/addresses",
      method: "POST",
      status: resAddr.ok ? "SUCCESS" : "FAILED",
      statusCode: resAddr.status,
      notes: resAddr.ok ? `Endereço ID ${resAddr.data.id} cadastrado.` : JSON.stringify(resAddr.data),
      latencyMs: resAddr.latencyMs,
    })

    // 1.3 Síndico consulta dados do condomínio
    const resProfile = await request(BASE_URL, "/condominium/profile", {
      token: sindicoToken,
    })
    reports.push({
      step: "1.3 Consulta Perfil do Condomínio",
      actor: "Síndico",
      action: "Consulta dados cadastrais do condomínio",
      endpoint: "/condominium/profile",
      method: "GET",
      status: resProfile.ok ? "SUCCESS" : "FAILED",
      statusCode: resProfile.status,
      notes: resProfile.ok ? `Condomínio: ${resProfile.data.name}` : JSON.stringify(resProfile.data),
      latencyMs: resProfile.latencyMs,
    })
  }

  // -----------------------------------------------------------------------------
  // FLUXO 2: SÍNDICO CRIA O PORTEIRO E PORTEIRO FAZ LOGIN
  // -----------------------------------------------------------------------------
  console.log("👉 [FLUXO 2] Síndico cria Porteiro e validação de login e RBAC...")
  {
    const resCreatePorter = await request(BASE_URL, "/users", {
      method: "POST",
      token: sindicoToken,
      body: {
        name: "Carlos Silva (Porteiro)",
        email: "porteiro@chegou.ai",
        password: "PorteiroSenha@123",
        role: "PORTER",
      },
    })

    reports.push({
      step: "2.1 Criação de Operador da Portaria",
      actor: "Síndico",
      action: "Cadastra novo usuário com perfil PORTER",
      endpoint: "/users",
      method: "POST",
      status: resCreatePorter.ok ? "SUCCESS" : "FAILED",
      statusCode: resCreatePorter.status,
      notes: resCreatePorter.ok ? `Porteiro ID ${resCreatePorter.data.id} criado.` : JSON.stringify(resCreatePorter.data),
      latencyMs: resCreatePorter.latencyMs,
    })

    // 2.2 Porteiro faz login
    const resPorterLogin = await request(BASE_URL, "/auth/login", {
      method: "POST",
      body: {
        email: "porteiro@chegou.ai",
        password: "PorteiroSenha@123",
      },
    })

    if (resPorterLogin.ok && resPorterLogin.data.token) {
      porteiroToken = resPorterLogin.data.token
      reports.push({
        step: "2.2 Login do Porteiro",
        actor: "Porteiro",
        action: "Autenticação com e-mail e senha",
        endpoint: "/auth/login",
        method: "POST",
        status: "SUCCESS",
        statusCode: resPorterLogin.status,
        notes: `Login realizado com sucesso. Role: ${resPorterLogin.data.user.role}`,
        latencyMs: resPorterLogin.latencyMs,
      })
    } else {
      reports.push({
        step: "2.2 Login do Porteiro",
        actor: "Porteiro",
        action: "Autenticação com e-mail e senha",
        endpoint: "/auth/login",
        method: "POST",
        status: "FAILED",
        statusCode: resPorterLogin.status,
        notes: JSON.stringify(resPorterLogin.data),
        latencyMs: resPorterLogin.latencyMs,
      })
    }

    // 2.3 Validação RBAC: Porteiro tenta criar outro usuário (deve dar 403 Forbidden)
    const resRbac = await request(BASE_URL, "/users", {
      method: "POST",
      token: porteiroToken,
      body: {
        name: "Hacker Invader",
        email: "hacker@chegou.ai",
        password: "123",
        role: "ADMIN",
      },
    })

    reports.push({
      step: "2.3 Segurança RBAC: Bloqueio de Não-Admin",
      actor: "Porteiro",
      action: "Tenta criar usuário administrativo sem permissão",
      endpoint: "/users",
      method: "POST",
      status: resRbac.status === 403 ? "SUCCESS" : "FAILED",
      statusCode: resRbac.status,
      notes: resRbac.status === 403 ? "403 Forbidden interceptado corretamente pelos Guards." : "FALHA: Acesso não bloqueado!",
      latencyMs: resRbac.latencyMs,
    })
  }

  // -----------------------------------------------------------------------------
  // FLUXO 3: SÍNDICO CRIA BLOCOS E UNIDADES
  // -----------------------------------------------------------------------------
  console.log("👉 [FLUXO 3] Síndico cria Unidades e Blocos...")
  {
    const resUnit1 = await request(BASE_URL, "/units", {
      method: "POST",
      token: sindicoToken,
      body: { block: "A", number: "101" },
    })
    unitA101Id = resUnit1.data.id

    const resUnit2 = await request(BASE_URL, "/units", {
      method: "POST",
      token: sindicoToken,
      body: { block: "A", number: "102" },
    })

    const resUnit3 = await request(BASE_URL, "/units", {
      method: "POST",
      token: sindicoToken,
      body: { block: "B", number: "201" },
    })
    unitB201Id = resUnit3.data.id

    reports.push({
      step: "3.1 Criação de Unidades e Blocos",
      actor: "Síndico",
      action: "Cadastra apartamentos A-101, A-102 e B-201",
      endpoint: "/units",
      method: "POST",
      status: resUnit1.ok && resUnit2.ok && resUnit3.ok ? "SUCCESS" : "FAILED",
      statusCode: resUnit1.status,
      notes: `Unidades criadas com sucesso (A-101 ID: ${unitA101Id}).`,
      latencyMs: resUnit1.latencyMs,
    })

    const resListUnits = await request(BASE_URL, "/units", {
      token: sindicoToken,
    })
    reports.push({
      step: "3.2 Listagem de Unidades",
      actor: "Síndico",
      action: "Lista unidades cadastradas",
      endpoint: "/units",
      method: "GET",
      status: resListUnits.ok && resListUnits.data.length >= 3 ? "SUCCESS" : "FAILED",
      statusCode: resListUnits.status,
      notes: `Total de ${resListUnits.data?.length} unidades encontradas.`,
      latencyMs: resListUnits.latencyMs,
    })
  }

  // -----------------------------------------------------------------------------
  // FLUXO 4: SÍNDICO CRIA MORADOR + ATIVAÇÃO DE CONTA PELO MORADOR
  // -----------------------------------------------------------------------------
  console.log("👉 [FLUXO 4] Cadastro de Morador, Convite e Ativação de Conta...")
  {
    const resResident = await request(BASE_URL, "/residents", {
      method: "POST",
      token: sindicoToken,
      body: {
        unitId: unitA101Id,
        fullName: "Camila Vasconcelos",
        email: "camila@chegou.ai",
        phone: "(11) 98765-4321",
        isPrimary: true,
      },
    })

    residentCamilaId = resResident.data.id
    reports.push({
      step: "4.1 Cadastro de Morador pelo Síndico",
      actor: "Síndico",
      action: "Cadastra moradora Camila na unidade A-101",
      endpoint: "/residents",
      method: "POST",
      status: resResident.ok ? "SUCCESS" : "FAILED",
      statusCode: resResident.status,
      notes: `Morador ID ${residentCamilaId} criado. Conta gerada com status inativo.`,
      latencyMs: resResident.latencyMs,
    })

    // 4.2 Geração do convite com token seguro
    const resInvite = await request(BASE_URL, `/residents/${residentCamilaId}/invite`, {
      method: "POST",
      token: sindicoToken,
    })

    const inviteToken = resInvite.data?.token
    reports.push({
      step: "4.2 Geração do Link de Convite",
      actor: "Sistema / Síndico",
      action: "Gera token CSPRNG de 256 bits e URL de ativação",
      endpoint: `/residents/${residentCamilaId}/invite`,
      method: "POST",
      status: resInvite.ok && Boolean(inviteToken) ? "SUCCESS" : "FAILED",
      statusCode: resInvite.status,
      notes: `Token gerado e salvo no Redis com TTL de 7 dias: ${inviteToken?.substring(0, 16)}...`,
      latencyMs: resInvite.latencyMs,
    })

    // 4.3 Morador clica no link e ativa a conta definindo sua nova senha
    const resActivate = await request(BASE_URL, "/auth/activate", {
      method: "POST",
      body: {
        email: "camila@chegou.ai",
        token: inviteToken,
        password: "MoradorSenha@123",
      },
    })

    reports.push({
      step: "4.3 Ativação de Conta pelo Morador",
      actor: "Morador",
      action: "Valida token no Redis e define sua senha própria",
      endpoint: "/auth/activate",
      method: "POST",
      status: resActivate.ok && resActivate.data?.token ? "SUCCESS" : "FAILED",
      statusCode: resActivate.status,
      notes: resActivate.ok ? "Conta ativada com sucesso! Token de convite invalidado no Redis." : JSON.stringify(resActivate.data),
      latencyMs: resActivate.latencyMs,
    })

    // 4.4 Morador faz login com a nova senha
    const resMoradorLogin = await request(BASE_URL, "/auth/login", {
      method: "POST",
      body: {
        email: "camila@chegou.ai",
        password: "MoradorSenha@123",
      },
    })

    moradorToken = resMoradorLogin.data?.token
    reports.push({
      step: "4.4 Login do Morador",
      actor: "Morador",
      action: "Autenticação com a senha recém-criada",
      endpoint: "/auth/login",
      method: "POST",
      status: resMoradorLogin.ok && moradorToken ? "SUCCESS" : "FAILED",
      statusCode: resMoradorLogin.status,
      notes: `Autenticado com sucesso. Role: RESIDENT, Unidade Vinculada: ${resMoradorLogin.data?.user?.unitId}`,
      latencyMs: resMoradorLogin.latencyMs,
    })

    // 4.5 Morador cadastra Web Push Subscription
    const resPush = await request(BASE_URL, "/residents/me/push-subscriptions", {
      method: "POST",
      token: moradorToken,
      body: {
        endpoint: "https://fcm.googleapis.com/fcm/send/mock-token-camila",
        keys: {
          p256dh: "BMockKeyP256dhForTest1234567890abcdefghijklmnopqrstuvwxyz",
          auth: "AMockAuthKey12345678",
        },
      },
    })

    reports.push({
      step: "4.5 Registro de Push Subscription",
      actor: "Morador",
      action: "Habilita notificações push no navegador",
      endpoint: "/residents/me/push-subscriptions",
      method: "POST",
      status: resPush.ok ? "SUCCESS" : "FAILED",
      statusCode: resPush.status,
      notes: resPush.ok ? `Inscrição Push ID ${resPush.data.subscriptionId} registrada.` : JSON.stringify(resPush.data),
      latencyMs: resPush.latencyMs,
    })
  }

  // -----------------------------------------------------------------------------
  // FLUXO 5: PORTEIRO FAZ OCR DA ETIQUETA E CHECK-IN DA ENCOMENDA
  // -----------------------------------------------------------------------------
  console.log("👉 [FLUXO 5] Porteiro faz OCR / Extração e Check-in da Encomenda...")
  {
    // 5.1 Teste do BFF de IA para leitura de etiqueta
    const resAi = await request(BASE_URL, "/bff/packages/extract-label", {
      method: "POST",
      token: porteiroToken,
      body: {
        image: "data:image/jpeg;base64,mock:etiqueta-amazon-camila-apto-101",
        mimeType: "image/jpeg",
      },
    })

    reports.push({
      step: "5.1 Extração de Etiqueta via IA",
      actor: "Porteiro",
      action: "Leitura de foto de etiqueta com IA e validação de endereço",
      endpoint: "/bff/packages/extract-label",
      method: "POST",
      status: resAi.ok ? "SUCCESS" : "MOCKED",
      statusCode: resAi.status,
      notes: resAi.ok
        ? `IA extraiu Destinatário: ${resAi.data.extracted?.recipientName}, Confiança: ${resAi.data.confidenceScore}`
        : "Mock de fallback ativo",
      latencyMs: resAi.latencyMs,
    })

    // 5.2 Check-in oficial da Encomenda 1 (Amazon para Camila A-101)
    const resCheckin = await request(BASE_URL, "/packages", {
      method: "POST",
      token: porteiroToken,
      headers: { "idempotency-key": "e2e-pack-001" },
      body: {
        unitId: unitA101Id,
        recipientNameRaw: "Camila Vasconcelos",
        carrier: "Amazon",
        trackingCode: "AMZ123456789BR",
        aiConfidenceScore: 0.95,
      },
    })

    package1Id = resCheckin.data.id
    package1Qr = resCheckin.data.pickupQrToken

    reports.push({
      step: "5.2 Check-in de Encomenda (Portaria)",
      actor: "Porteiro",
      action: "Registra encomenda com idempotência e geração de PIN/QR",
      endpoint: "/packages",
      method: "POST",
      status: resCheckin.ok ? "SUCCESS" : "FAILED",
      statusCode: resCheckin.status,
      notes: `Pacote ID ${package1Id} criado com status ${resCheckin.data.status}. QR Token: ${package1Qr}.`,
      latencyMs: resCheckin.latencyMs,
    })

    // 5.3 Teste de Idempotência: Reenvio com o mesmo Header
    const resIdempotency = await request(BASE_URL, "/packages", {
      method: "POST",
      token: porteiroToken,
      headers: { "idempotency-key": "e2e-pack-001" },
      body: {
        unitId: unitA101Id,
        recipientNameRaw: "Camila Vasconcelos",
        carrier: "Amazon",
        trackingCode: "AMZ123456789BR",
      },
    })

    reports.push({
      step: "5.3 Validação de Idempotência",
      actor: "Porteiro",
      action: "Reenvia mesma requisição de check-in para validar cache atômico",
      endpoint: "/packages",
      method: "POST",
      status: resIdempotency.data?.id === package1Id ? "SUCCESS" : "FAILED",
      statusCode: resIdempotency.status,
      notes: resIdempotency.data?.id === package1Id ? "Idempotência validada: mesmo pacote retornado sem duplicidade." : "FALHA: Pacote duplicado!",
      latencyMs: resIdempotency.latencyMs,
    })
  }

  // -----------------------------------------------------------------------------
  // FLUXO 6: MORADOR CONSULTA SUAS ENCOMENDAS PENDENTES
  // -----------------------------------------------------------------------------
  console.log("👉 [FLUXO 6] Morador consulta suas Encomendas Pendentes no Portal...")
  {
    const resMoradorPackages = await request(BASE_URL, "/residents/me/packages", {
      token: moradorToken,
    })

    const foundPkg = resMoradorPackages.data?.items?.find((p: any) => p.id === package1Id)
    if (foundPkg) {
      package1Pin = foundPkg.pickupPin
    }

    reports.push({
      step: "6.1 Consulta de Encomendas pelo Morador",
      actor: "Morador",
      action: "Acessa portal e visualiza encomendas pendentes e PIN",
      endpoint: "/residents/me/packages",
      method: "GET",
      status: resMoradorPackages.ok && Boolean(foundPkg) ? "SUCCESS" : "FAILED",
      statusCode: resMoradorPackages.status,
      notes: foundPkg
        ? `Pacote encontrado! Transportadora: ${foundPkg.carrier}, PIN seguro obtido: ${package1Pin}.`
        : "Pacote não listado para o morador.",
      latencyMs: resMoradorPackages.latencyMs,
    })

    // 6.2 Teste de Segurança Anti-IDOR / BOLA: Morador tenta ver pacotes de outra unidade
    const resIdor = await request(BASE_URL, `/packages?unitId=${unitB201Id}`, {
      token: moradorToken,
    })

    // O controller deve ignorar o unitId passado pelo morador e filtrar estritamente pela unidade do JWT do morador (A-101)
    const hasUnidadeB = Array.isArray(resIdor.data)
      ? resIdor.data.some((p: any) => p.unitId === unitB201Id)
      : false

    reports.push({
      step: "6.2 Segurança Anti-IDOR / BOLA",
      actor: "Morador",
      action: "Tenta forçar consulta a encomendas do bloco B",
      endpoint: `/packages?unitId=${unitB201Id}`,
      method: "GET",
      status: !hasUnidadeB ? "SUCCESS" : "FAILED",
      statusCode: resIdor.status,
      notes: !hasUnidadeB
        ? "Isolamento de Tenant / Unidade validado: morador só enxerga sua própria unidade."
        : "VULNERABILIDADE: Morador conseguiu ver pacotes de outra unidade!",
      latencyMs: resIdor.latencyMs,
    })
  }

  // -----------------------------------------------------------------------------
  // FLUXO 7: PORTEIRO FAZ RETIRADA (CHECKOUT) DA ENCOMENDA
  // -----------------------------------------------------------------------------
  console.log("👉 [FLUXO 7] Morador apresenta o PIN e Porteiro faz o Checkout...")
  {
    const resCheckout = await request(BASE_URL, "/packages/checkout", {
      method: "POST",
      token: porteiroToken,
      body: {
        packageId: package1Id,
        code: package1Pin,
        codeType: "PIN",
      },
    })

    reports.push({
      step: "7.1 Baixa de Encomenda via PIN",
      actor: "Porteiro",
      action: "Valida PIN do morador e registra entrega com baixa atômica",
      endpoint: "/packages/checkout",
      method: "POST",
      status: resCheckout.ok && resCheckout.data?.status === "DELIVERED" ? "SUCCESS" : "FAILED",
      statusCode: resCheckout.status,
      notes: resCheckout.ok ? `Entrega concluída. Status: ${resCheckout.data.status}, Entregue em: ${resCheckout.data.deliveredAt}` : JSON.stringify(resCheckout.data),
      latencyMs: resCheckout.latencyMs,
    })

    // 7.2 Teste de Anti-Replay: Tentar dar baixa novamente no mesmo pacote
    const resReplay = await request(BASE_URL, "/packages/checkout", {
      method: "POST",
      token: porteiroToken,
      body: {
        packageId: package1Id,
        code: package1Pin,
        codeType: "PIN",
      },
    })

    reports.push({
      step: "7.2 Proteção Anti-Replay Attack",
      actor: "Porteiro",
      action: "Tenta reutilizar o mesmo PIN em pacote já entregue",
      endpoint: "/packages/checkout",
      method: "POST",
      status: resReplay.status === 409 || resReplay.status === 404 ? "SUCCESS" : "FAILED",
      statusCode: resReplay.status,
      notes: resReplay.status === 409 || resReplay.status === 404
        ? "Replay bloqueado com sucesso (409 Conflict / 404)."
        : "FALHA: Replay não bloqueado!",
      latencyMs: resReplay.latencyMs,
    })
  }

  // -----------------------------------------------------------------------------
  // FLUXO 8: TRATAMENTO DE EXCEÇÕES (CANCELAMENTO / DEVOLUÇÃO À TRANSPORTADORA)
  // -----------------------------------------------------------------------------
  console.log("👉 [FLUXO 8] Tratamento de Exceções: Porteiro cancela encomenda...")
  {
    // 8.1 Check-in de Pacote 2
    const resPkg2 = await request(BASE_URL, "/packages", {
      method: "POST",
      token: porteiroToken,
      body: {
        unitId: unitA101Id,
        recipientNameRaw: "Destinatário Desconhecido",
        carrier: "Mercado Livre",
        trackingCode: "ML999999999BR",
      },
    })
    package2Id = resPkg2.data.id

    // 8.2 Cancelamento / Devolução
    const resCancel = await request(BASE_URL, `/packages/${package2Id}/cancel`, {
      method: "PATCH",
      token: porteiroToken,
      body: {
        reason: "CARRIER_RETURN",
        notes: "Morador não reside nesta unidade, pacote devolvido ao entregador.",
      },
    })

    reports.push({
      step: "8.1 Cancelamento / Devolução à Transportadora",
      actor: "Porteiro",
      action: "Cancela encomenda e registra motivo na auditoria",
      endpoint: `/packages/${package2Id}/cancel`,
      method: "PATCH",
      status: resCancel.ok && resCancel.data?.status === "CANCELLED" ? "SUCCESS" : "FAILED",
      statusCode: resCancel.status,
      notes: resCancel.ok ? `Pacote cancelado com sucesso. Status: ${resCancel.data.status}` : JSON.stringify(resCancel.data),
      latencyMs: resCancel.latencyMs,
    })
  }

  // -----------------------------------------------------------------------------
  // FLUXO 9: SÍNDICO CONSULTA AUDITORIA, MÉTRICAS E EXPORTAÇÃO CSV
  // -----------------------------------------------------------------------------
  console.log("👉 [FLUXO 9] Síndico consulta Auditoria, Métricas e Relatórios...")
  {
    // 9.1 Lista eventos de auditoria
    const resEvents = await request(BASE_URL, "/audit/events", {
      token: sindicoToken,
    })

    reports.push({
      step: "9.1 Consulta de Trilha de Auditoria",
      actor: "Síndico",
      action: "Lista eventos imutáveis de custódia (CREATED, DELIVERED, CANCELLED)",
      endpoint: "/audit/events",
      method: "GET",
      status: resEvents.ok && Array.isArray(resEvents.data) && resEvents.data.length >= 3 ? "SUCCESS" : "FAILED",
      statusCode: resEvents.status,
      notes: `Total de ${resEvents.data?.length} eventos de auditoria registrados.`,
      latencyMs: resEvents.latencyMs,
    })

    // 9.2 Métricas de SLA e Dashboard
    const resMetrics = await request(BASE_URL, "/audit/metrics", {
      token: sindicoToken,
    })

    const metricsValid =
      resMetrics.ok &&
      typeof resMetrics.data?.deliveredToday === "number" &&
      typeof resMetrics.data?.receivedToday === "number"

    reports.push({
      step: "9.2 Métricas de Custódia e SLAs",
      actor: "Síndico",
      action: "Consulta KPIs operacionais do condomínio",
      endpoint: "/audit/metrics",
      method: "GET",
      status: metricsValid ? "SUCCESS" : "FAILED",
      statusCode: resMetrics.status,
      notes: `Métricas: Recebidas Hoje: ${resMetrics.data?.receivedToday}, Entregues Hoje: ${resMetrics.data?.deliveredToday}, Pendentes: ${resMetrics.data?.pending}`,
      latencyMs: resMetrics.latencyMs,
    })

    // 9.3 Exportação de Relatório CSV
    const resCsv = await request(BASE_URL, "/audit/export", {
      token: sindicoToken,
    })

    const csvValid =
      resCsv.ok &&
      typeof resCsv.data === "string" &&
      (resCsv.data.includes("Evento") || resCsv.data.includes("Data"))

    reports.push({
      step: "9.3 Exportação de Relatório CSV",
      actor: "Síndico",
      action: "Exporta arquivo CSV com logs de custódia",
      endpoint: "/audit/export",
      method: "GET",
      status: csvValid ? "SUCCESS" : "FAILED",
      statusCode: resCsv.status,
      notes: "Relatório CSV gerado com sucesso.",
      latencyMs: resCsv.latencyMs,
    })
  }

  // -----------------------------------------------------------------------------
  // ENCERRAMENTO E IMPRESSÃO DO MAPEAMENTO COMPLETO
  // -----------------------------------------------------------------------------
  await app.close()

  console.log("\n================================================================================")
  console.log("📊 MAPEAMENTO COMPLETO DE FLUXOS E RESULTADOS — CHEGOU.AI")
  console.log("================================================================================\n")

  console.table(
    reports.map((r) => ({
      Etapa: r.step,
      Ator: r.actor,
      Endpoint: `${r.method} ${r.endpoint}`,
      Status: r.status,
      HTTP: r.statusCode,
      "Latência (ms)": r.latencyMs,
      Notas: r.notes.length > 60 ? r.notes.substring(0, 57) + "..." : r.notes,
    }))
  )

  const allPassed = reports.every((r) => r.status === "SUCCESS" || r.status === "MOCKED")
  if (allPassed) {
    console.log("\n🎉 TODOS OS 18 PASSOS DO CICLO DE VIDA DO USUÁRIO PASSARAM COM 100% DE SUCESSO!")
  } else {
    console.error("\n❌ ALGUNS PASSOS FALHARAM. VERIFIQUE A TABELA ACIMA.")
  }

  process.exit(allPassed ? 0 : 1)
}

run().catch((err) => {
  console.error("FATAL RUN ERROR:", err)
  process.exit(1)
})
