import { NestFactory } from "@nestjs/core"
import { ValidationPipe, Logger } from "@nestjs/common"
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger"
import { AppModule } from "./app.module"
import { Rfc7807ExceptionFilter } from "./common/filters/rfc7807-exception.filter"
import helmet from "helmet"
import * as express from "express"

async function bootstrap() {
  const logger = new Logger("Bootstrap")
  logger.log("1. Iniciando bootstrap do NestJS...")

  const app = await NestFactory.create(AppModule, {
    logger: ["log", "error", "warn", "debug", "verbose"],
  })
  logger.log("2. AppModule criado com sucesso.")

  // Hardening de Cabeçalhos HTTP (CSP, HSTS, X-Frame-Options, X-Content-Type-Options)
  app.use(
    helmet({
      contentSecurityPolicy: false, // Desativa CSP no backend de API JSON para evitar conflito com BFF Next.js
      crossOriginEmbedderPolicy: false,
    })
  )

  // Limite para payload de requisições (10MB para upload de imagem Base64 na portaria)
  app.use(express.json({ limit: "10mb" }))
  app.use(express.urlencoded({ limit: "10mb", extended: true }))

  const isProduction = process.env.NODE_ENV === "production"

  // Separação estrita de origens permitidas (CORS) por ambiente
  const allowedOrigins: (string | RegExp)[] = isProduction
    ? ["https://chegou-ai-ten.vercel.app"]
    : [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        /^http:\/\/192\.168\.\d+\.\d+:3000$/,
        /^http:\/\/10\.\d+\.\d+\.\d+:3000$/,
      ]

  const appendEnvOrigin = (rawUrl?: string) => {
    if (!rawUrl) return
    const cleanUrl = rawUrl.trim().replace(/\/+$/, "")
    if (!cleanUrl) return

    // Em produção, bloqueia origens locais (localhost/loopback/rede privada) caso estejam em variáveis de ambiente
    if (
      isProduction &&
      /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$/i.test(
        cleanUrl
      )
    ) {
      return
    }

    if (!allowedOrigins.includes(cleanUrl)) {
      allowedOrigins.push(cleanUrl)
    }
  }

  appendEnvOrigin(process.env.FRONTEND_URL)
  if (process.env.ALLOWED_ORIGINS) {
    process.env.ALLOWED_ORIGINS.split(",").forEach(appendEnvOrigin)
  }

  logger.log(
    `🔒 CORS [${isProduction ? "PRODUCTION" : "DEVELOPMENT"}] origens permitidas: ${allowedOrigins
      .map((o) => o.toString())
      .join(", ")}`
  )

  // CORS habilitado para o Front-end Next.js
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Idempotency-Key", "idempotency-key"],
  })

  // Prefixo Global da API (/api/v1)
  app.setGlobalPrefix("api/v1")

  // Filtro de Exceções Global RFC 7807 (Problem Details)
  app.useGlobalFilters(new Rfc7807ExceptionFilter())

  // Pipe Global de Validação
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    })
  )

  const port = process.env.PORT || 8080

  // Configuração do Swagger / OpenAPI (Ativo em desenvolvimento ou com flag explícita)
  const isSwaggerEnabled =
    process.env.NODE_ENV !== "production" || process.env.SWAGGER_ENABLED === "true"

  if (isSwaggerEnabled) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle("Chegou.AI — Core API")
      .setDescription(
        "Documentação oficial da API do Chegou.AI para gestão inteligente de portaria, notificações push e encomendas condominiais com visão computacional (Gemini)."
      )
      .setVersion("1.0.0")
      .addBearerAuth(
        {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          name: "Authorization",
          description: "Insira o token JWT gerado no login (Bearer <token>)",
          in: "header",
        },
        "JWT-auth"
      )
      .addTag("Auth", "Autenticação, primeiro acesso, setup inicial e redefinição de senha")
      .addTag("Condominium", "Perfil institucional e gestão de endereços oficiais do condomínio")
      .addTag("Users", "Gestão de operadores da portaria e equipe administrativa")
      .addTag("Units", "Gestão de blocos e apartamentos")
      .addTag("Residents", "Cadastro de moradores, links de convite e inscrições Web Push")
      .addTag("Packages", "Custódia, check-in, check-out atômico com PIN/QR e cancelamento")
      .addTag("BFF / AI", "Extração zero-shot de etiquetas via Gemini com validação de endereço")
      .addTag("Audit", "Trilha imutável de eventos, métricas de SLA e exportação CSV")
      .build()

    const document = SwaggerModule.createDocument(app, swaggerConfig)
    SwaggerModule.setup("api/docs", app, document, {
      customSiteTitle: "Chegou.AI — API Documentation",
      swaggerOptions: {
        persistAuthorization: true,
        filter: true,
        tagsSorter: "alpha",
        operationsSorter: "alpha",
      },
    })
    logger.log(`📚 Swagger UI disponível em: http://localhost:${port}/api/docs`)
    logger.log(`📄 Especificação OpenAPI JSON em: http://localhost:${port}/api/docs-json`)
  }

  logger.log("3. Middleware, CORS, filtros, pipes e Swagger configurados.")

  await app.listen(port, "0.0.0.0")
  logger.log(`4. 🚀 Chegou.AI Core API iniciado com sucesso na porta ${port}`)
  logger.log(`🔗 API Base URL: http://localhost:${port}/api/v1`)
}

bootstrap().catch((err) => {
  console.error("FATAL BOOTSTRAP ERROR:", err)
  process.exit(1)
})