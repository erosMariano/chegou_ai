import * as fs from "fs"
import * as path from "path"

interface InsomniaResource {
  _id: string
  _type: string
  parentId: string
  name: string
  description?: string
  [key: string]: any
}

const resources: InsomniaResource[] = []

const WORKSPACE_ID = "wrk_chegou_ai"
const ENV_ID = "env_chegou_ai"

resources.push({
  _id: WORKSPACE_ID,
  _type: "workspace",
  parentId: "__WORKSPACE_ID__",
  name: "Chegou.AI — Core API Collection",
  description: "Coleção completa de endpoints para gestão de encomendas, portaria e moradores do Chegou.AI",
  scope: "collection",
})

resources.push({
  _id: ENV_ID,
  _type: "environment",
  parentId: WORKSPACE_ID,
  name: "Desenvolvimento Local",
  data: {
    base_url: "http://localhost:8080",
    token: "",
    unit_id: "",
    resident_id: "",
    package_id: "",
  },
  dataPropertyOrder: {
    "&": ["base_url", "token", "unit_id", "resident_id", "package_id"],
  },
  color: "#E1FF01",
  isPrivate: false,
})

function addFolder(id: string, name: string, description: string): string {
  resources.push({
    _id: id,
    _type: "request_group",
    parentId: WORKSPACE_ID,
    name,
    description,
  })
  return id
}

function addRequest(params: {
  id: string
  folderId: string
  name: string
  method: string
  path: string
  body?: any
  requiresAuth?: boolean
  description?: string
  headers?: Array<{ name: string; value: string }>
}) {
  const reqHeaders = [
    { name: "Content-Type", value: "application/json" },
    ...(params.headers || []),
  ]

  const authentication: any = params.requiresAuth
    ? {
        type: "bearer",
        token: "{{ _.token }}",
        prefix: "Bearer",
      }
    : {}

  resources.push({
    _id: params.id,
    _type: "request",
    parentId: params.folderId,
    name: params.name,
    description: params.description || "",
    method: params.method,
    url: `{{ _.base_url }}${params.path}`,
    headers: reqHeaders,
    body: params.body
      ? {
          mimeType: "application/json",
          text: JSON.stringify(params.body, null, 2),
        }
      : {},
    authentication,
    parameters: [],
  })
}

// -----------------------------------------------------------------------------
// 1. AUTH
// -----------------------------------------------------------------------------
const fAuth = addFolder("fld_auth", "1. Autenticação & Acesso (Auth)", "Login, tokens, setup inicial e recuperação de senhas")

addRequest({
  id: "req_auth_login",
  folderId: fAuth,
  name: "Login com E-mail e Senha",
  method: "POST",
  path: "/api/v1/auth/login",
  body: {
    email: "sindico@chegou.ai",
    password: "SenhaSegura@123",
  },
  description: "Autentica usuário e retorna token JWT",
})

addRequest({
  id: "req_auth_demo_admin",
  folderId: fAuth,
  name: "Login Rápido Demo (Síndico)",
  method: "POST",
  path: "/api/v1/auth/demo/admin",
  description: "Login demo sem senha para ambiente de desenvolvimento",
})

addRequest({
  id: "req_auth_demo_porter",
  folderId: fAuth,
  name: "Login Rápido Demo (Porteiro)",
  method: "POST",
  path: "/api/v1/auth/demo/porter",
  description: "Login demo como porteiro",
})

addRequest({
  id: "req_auth_demo_resident",
  folderId: fAuth,
  name: "Login Rápido Demo (Morador)",
  method: "POST",
  path: "/api/v1/auth/demo/resident",
  description: "Login demo como morador",
})

addRequest({
  id: "req_auth_setup_initial",
  folderId: fAuth,
  name: "Setup Inicial do Condomínio & Síndico",
  method: "POST",
  path: "/api/v1/auth/setup-initial-admin",
  body: {
    condominiumName: "Condomínio Residencial Jardins do Sol",
    cnpj: "12.345.678/0001-90",
    name: "Roberto Almeida (Síndico)",
    email: "sindico@chegou.ai",
    password: "SenhaSegura@123",
  },
  description: "Cria condomínio e primeiro síndico quando o banco está zerado",
})

addRequest({
  id: "req_auth_me",
  folderId: fAuth,
  name: "Perfil do Usuário Autenticado",
  method: "GET",
  path: "/api/v1/auth/me",
  requiresAuth: true,
  description: "Retorna dados e permissões do token atual",
})

addRequest({
  id: "req_auth_activate",
  folderId: fAuth,
  name: "Ativar Conta com Token de Convite",
  method: "POST",
  path: "/api/v1/auth/activate",
  body: {
    email: "mariana.costa@email.com",
    token: "token_recebido_no_convite",
    password: "MinhaNovaSenha@2026",
  },
  description: "Primeiro acesso do morador definindo sua senha própria",
})

addRequest({
  id: "req_auth_forgot",
  folderId: fAuth,
  name: "Esqueci Minha Senha",
  method: "POST",
  path: "/api/v1/auth/forgot-password",
  body: {
    email: "sindico@chegou.ai",
  },
  description: "Dispara e-mail com token temporário de redefinição",
})

addRequest({
  id: "req_auth_reset",
  folderId: fAuth,
  name: "Redefinir Senha com Token",
  method: "POST",
  path: "/api/v1/auth/reset-password",
  body: {
    email: "sindico@chegou.ai",
    token: "token_temporario_recebido_por_email",
    newPassword: "NovaSenhaRedefinida@2026",
  },
  description: "Cadastra nova senha validando o token do Redis",
})

addRequest({
  id: "req_auth_logout",
  folderId: fAuth,
  name: "Logout",
  method: "POST",
  path: "/api/v1/auth/logout",
  description: "Encerramento de sessão",
})

// -----------------------------------------------------------------------------
// 2. CONDOMINIUM
// -----------------------------------------------------------------------------
const fCondo = addFolder("fld_condo", "2. Condomínio & Endereços (Condominium)", "Configurações institucionais e endereços oficiais")

addRequest({
  id: "req_condo_get_profile",
  folderId: fCondo,
  name: "Consultar Perfil do Condomínio",
  method: "GET",
  path: "/api/v1/condominium/profile",
  requiresAuth: true,
})

addRequest({
  id: "req_condo_put_profile",
  folderId: fCondo,
  name: "Atualizar Perfil do Condomínio",
  method: "PUT",
  path: "/api/v1/condominium/profile",
  requiresAuth: true,
  body: {
    name: "Condomínio Residencial Jardins do Sol",
    cnpj: "12.345.678/0001-90",
  },
})

addRequest({
  id: "req_condo_list_addresses",
  folderId: fCondo,
  name: "Listar Endereços Oficiais",
  method: "GET",
  path: "/api/v1/condominium/addresses",
  requiresAuth: true,
})

addRequest({
  id: "req_condo_create_address",
  folderId: fCondo,
  name: "Cadastrar Endereço Oficial",
  method: "POST",
  path: "/api/v1/condominium/addresses",
  requiresAuth: true,
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

addRequest({
  id: "req_condo_patch_address",
  folderId: fCondo,
  name: "Atualizar Endereço Oficial",
  method: "PATCH",
  path: "/api/v1/condominium/addresses/{{ _.address_id }}",
  requiresAuth: true,
  body: {
    label: "Portaria Central",
    street: "Avenida das Américas",
    number: "1500",
  },
})

addRequest({
  id: "req_condo_del_address",
  folderId: fCondo,
  name: "Remover Endereço Oficial",
  method: "DELETE",
  path: "/api/v1/condominium/addresses/{{ _.address_id }}",
  requiresAuth: true,
})

// -----------------------------------------------------------------------------
// 3. USERS
// -----------------------------------------------------------------------------
const fUsers = addFolder("fld_users", "3. Gestão de Operadores & Usuários (Users)", "Cadastro de porteiros, admins e controle de acesso")

addRequest({
  id: "req_users_list",
  folderId: fUsers,
  name: "Listar Usuários (Filtros & Busca)",
  method: "GET",
  path: "/api/v1/users?role=PORTER&page=1&limit=20",
  requiresAuth: true,
})

addRequest({
  id: "req_users_get_one",
  folderId: fUsers,
  name: "Consultar Usuário por ID",
  method: "GET",
  path: "/api/v1/users/{{ _.user_id }}",
  requiresAuth: true,
})

addRequest({
  id: "req_users_create",
  folderId: fUsers,
  name: "Cadastrar Operador ou Administrador",
  method: "POST",
  path: "/api/v1/users",
  requiresAuth: true,
  body: {
    name: "Carlos Silva (Porteiro)",
    email: "porteiro@chegou.ai",
    password: "PorteiroSenha@123",
    role: "PORTER",
  },
})

addRequest({
  id: "req_users_update",
  folderId: fUsers,
  name: "Editar Usuário",
  method: "PUT",
  path: "/api/v1/users/{{ _.user_id }}",
  requiresAuth: true,
  body: {
    name: "Carlos Silva Jr.",
    email: "carlos.porteiro@chegou.ai",
  },
})

addRequest({
  id: "req_users_toggle_status",
  folderId: fUsers,
  name: "Alternar Status (Ativo / Inativo)",
  method: "PATCH",
  path: "/api/v1/users/{{ _.user_id }}/toggle-status",
  requiresAuth: true,
})

addRequest({
  id: "req_users_delete",
  folderId: fUsers,
  name: "Remover Usuário",
  method: "DELETE",
  path: "/api/v1/users/{{ _.user_id }}",
  requiresAuth: true,
})

// -----------------------------------------------------------------------------
// 4. UNITS
// -----------------------------------------------------------------------------
const fUnits = addFolder("fld_units", "4. Unidades & Blocos (Units)", "Gestão de blocos e apartamentos")

addRequest({
  id: "req_units_list",
  folderId: fUnits,
  name: "Listar Unidades",
  method: "GET",
  path: "/api/v1/units",
})

addRequest({
  id: "req_units_get_one",
  folderId: fUnits,
  name: "Consultar Unidade por ID",
  method: "GET",
  path: "/api/v1/units/{{ _.unit_id }}",
  requiresAuth: true,
})

addRequest({
  id: "req_units_create",
  folderId: fUnits,
  name: "Cadastrar Unidade Individual",
  method: "POST",
  path: "/api/v1/units",
  requiresAuth: true,
  body: {
    block: "A",
    number: "101",
  },
})

addRequest({
  id: "req_units_update",
  folderId: fUnits,
  name: "Editar Unidade",
  method: "PUT",
  path: "/api/v1/units/{{ _.unit_id }}",
  requiresAuth: true,
  body: {
    block: "A",
    number: "101",
    isActive: true,
  },
})

addRequest({
  id: "req_units_delete",
  folderId: fUnits,
  name: "Remover Unidade",
  method: "DELETE",
  path: "/api/v1/units/{{ _.unit_id }}",
  requiresAuth: true,
})

addRequest({
  id: "req_units_template_csv",
  folderId: fUnits,
  name: "Baixar Template CSV de Unidades",
  method: "GET",
  path: "/api/v1/units/template-csv",
  requiresAuth: true,
})

addRequest({
  id: "req_units_import_batch",
  folderId: fUnits,
  name: "Importar Unidades em Lote (CSV)",
  method: "POST",
  path: "/api/v1/units/import-batch",
  requiresAuth: true,
  body: {
    items: [
      { block: "A", number: "101" },
      { block: "A", number: "102" },
      { block: "B", number: "201" },
      { block: "B", number: "202" },
    ],
  },
})

// -----------------------------------------------------------------------------
// 5. RESIDENTS
// -----------------------------------------------------------------------------
const fResidents = addFolder("fld_residents", "5. Moradores & Notificações (Residents)", "Cadastro de condôminos, convites e Web Push")

addRequest({
  id: "req_residents_list",
  folderId: fResidents,
  name: "Listar Moradores",
  method: "GET",
  path: "/api/v1/residents?unitId={{ _.unit_id }}",
  requiresAuth: true,
})

addRequest({
  id: "req_residents_get_one",
  folderId: fResidents,
  name: "Consultar Morador por ID",
  method: "GET",
  path: "/api/v1/residents/{{ _.resident_id }}",
  requiresAuth: true,
})

addRequest({
  id: "req_residents_create",
  folderId: fResidents,
  name: "Cadastrar Morador Individual",
  method: "POST",
  path: "/api/v1/residents",
  requiresAuth: true,
  body: {
    unitId: "{{ _.unit_id }}",
    fullName: "Mariana Costa Silva",
    email: "mariana.costa@email.com",
    phone: "(11) 98765-4321",
    documentLast4: "8392",
    isPrimary: true,
  },
})

addRequest({
  id: "req_residents_update",
  folderId: fResidents,
  name: "Editar Morador",
  method: "PUT",
  path: "/api/v1/residents/{{ _.resident_id }}",
  requiresAuth: true,
  body: {
    fullName: "Mariana Costa Santos",
    phone: "(11) 99999-8888",
  },
})

addRequest({
  id: "req_residents_delete",
  folderId: fResidents,
  name: "Remover Morador",
  method: "DELETE",
  path: "/api/v1/residents/{{ _.resident_id }}",
  requiresAuth: true,
})

addRequest({
  id: "req_residents_invite",
  folderId: fResidents,
  name: "Gerar Link de Convite",
  method: "POST",
  path: "/api/v1/residents/{{ _.resident_id }}/invite",
  requiresAuth: true,
})

addRequest({
  id: "req_residents_template_csv",
  folderId: fResidents,
  name: "Baixar Template CSV de Moradores",
  method: "GET",
  path: "/api/v1/residents/template-csv",
  requiresAuth: true,
})

addRequest({
  id: "req_residents_import_batch",
  folderId: fResidents,
  name: "Importar Moradores em Lote (CSV)",
  method: "POST",
  path: "/api/v1/residents/import-batch",
  requiresAuth: true,
  body: {
    items: [
      {
        block: "A",
        number: "101",
        fullName: "João da Silva",
        email: "joao.silva@email.com",
        phone: "(11) 91234-5678",
        isPrimary: true,
      },
      {
        block: "A",
        number: "102",
        fullName: "Maria Oliveira",
        email: "maria.oliveira@email.com",
        phone: "(11) 98765-1234",
        isPrimary: true,
      },
    ],
  },
})

addRequest({
  id: "req_residents_my_packages",
  folderId: fResidents,
  name: "Minhas Encomendas (Portal Morador)",
  method: "GET",
  path: "/api/v1/residents/me/packages?status=PENDING",
  requiresAuth: true,
})

addRequest({
  id: "req_residents_push_sub",
  folderId: fResidents,
  name: "Registrar Web Push Subscription",
  method: "POST",
  path: "/api/v1/residents/me/push-subscriptions",
  requiresAuth: true,
  body: {
    endpoint: "https://fcm.googleapis.com/fcm/send/exemplo-endpoint-token",
    keys: {
      p256dh: "BMockPublicKeyP256dh...",
      auth: "AMockAuthKey...",
    },
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
  },
})

// -----------------------------------------------------------------------------
// 6. PACKAGES
// -----------------------------------------------------------------------------
const fPackages = addFolder("fld_packages", "6. Encomendas & Custódia (Packages)", "Check-in, checkout por PIN/QR e devolução")

addRequest({
  id: "req_packages_checkin",
  folderId: fPackages,
  name: "Check-in de Encomenda (Portaria)",
  method: "POST",
  path: "/api/v1/packages",
  requiresAuth: true,
  headers: [{ name: "idempotency-key", value: "checkin-pack-001" }],
  body: {
    unitId: "{{ _.unit_id }}",
    recipientNameRaw: "Mariana Costa Silva",
    carrier: "Amazon",
    trackingCode: "AMZ123456789BR",
    aiConfidenceScore: 0.95,
  },
})

addRequest({
  id: "req_packages_checkout",
  folderId: fPackages,
  name: "Baixa / Retirada por PIN ou QR Code",
  method: "POST",
  path: "/api/v1/packages/checkout",
  requiresAuth: true,
  body: {
    packageId: "{{ _.package_id }}",
    code: "839201",
    codeType: "PIN",
  },
})

addRequest({
  id: "req_packages_list",
  folderId: fPackages,
  name: "Listar Encomendas (Filtros & Busca)",
  method: "GET",
  path: "/api/v1/packages?status=RECEIVED&search=Amazon&page=1&limit=20",
  requiresAuth: true,
})

addRequest({
  id: "req_packages_get_one",
  folderId: fPackages,
  name: "Consultar Encomenda por ID",
  method: "GET",
  path: "/api/v1/packages/{{ _.package_id }}",
  requiresAuth: true,
})

addRequest({
  id: "req_packages_cancel",
  folderId: fPackages,
  name: "Cancelar ou Devolver à Transportadora",
  method: "PATCH",
  path: "/api/v1/packages/{{ _.package_id }}/cancel",
  requiresAuth: true,
  body: {
    reason: "CARRIER_RETURN",
    notes: "Destinatário ausente / Recusado na portaria",
  },
})

// -----------------------------------------------------------------------------
// 7. BFF & AI
// -----------------------------------------------------------------------------
const fAi = addFolder("fld_ai", "7. Visão Computacional / IA (BFF Packages)", "OCR de etiquetas via Gemini Flash")

addRequest({
  id: "req_ai_extract_label",
  folderId: fAi,
  name: "Extrair Dados de Etiqueta via IA",
  method: "POST",
  path: "/api/v1/bff/packages/extract-label",
  requiresAuth: true,
  body: {
    image: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD...",
    mimeType: "image/jpeg",
  },
})

// -----------------------------------------------------------------------------
// 8. AUDIT
// -----------------------------------------------------------------------------
const fAudit = addFolder("fld_audit", "8. Auditoria & Relatórios (Audit)", "Trilha append-only, SLAs e exportação de CSV")

addRequest({
  id: "req_audit_events",
  folderId: fAudit,
  name: "Listar Eventos de Custódia (Trilha)",
  method: "GET",
  path: "/api/v1/audit/events?page=1&limit=50",
  requiresAuth: true,
})

addRequest({
  id: "req_audit_metrics",
  folderId: fAudit,
  name: "Métricas Operacionais & SLAs",
  method: "GET",
  path: "/api/v1/audit/metrics",
  requiresAuth: true,
})

addRequest({
  id: "req_audit_export",
  folderId: fAudit,
  name: "Exportar Relatório CSV de Auditoria",
  method: "GET",
  path: "/api/v1/audit/export",
  requiresAuth: true,
})

// Gera arquivo final
const collection = {
  _type: "export",
  __export_format: 4,
  __export_date: new Date().toISOString(),
  __export_source: "insomnia.desktop.app:v8.6.1",
  resources,
}

const outputPath = path.resolve(__dirname, "../../../chegou-ai-insomnia-collection.json")
fs.writeFileSync(outputPath, JSON.stringify(collection, null, 2), "utf-8")
console.log(`✅ Coleção do Insomnia gerada com sucesso em: ${outputPath}`)
console.log(`Total de recursos gerados: ${resources.length} (33 endpoints + 8 pastas + ambiente)`)

