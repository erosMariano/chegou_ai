import { NestFactory } from "@nestjs/core"
import { ValidationPipe, Logger } from "@nestjs/common"
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

  const allowedOrigins: (string | RegExp)[] = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    /^http:\/\/192\.168\.\d+\.\d+:3000$/,
    /^http:\/\/10\.\d+\.\d+\.\d+:3000$/,
    "https://chegou-ai.vercel.app",
    "https://chegou.ai",
    "https://www.chegou.ai",
    /^https:\/\/chegou-ai(-[a-zA-Z0-9]+)?-erosmarianos-projects\.vercel\.app$/,
  ]

  if (process.env.FRONTEND_URL) {
    const cleanUrl = process.env.FRONTEND_URL.trim().replace(/\/+$/, "")
    allowedOrigins.push(cleanUrl)
    allowedOrigins.push(`${cleanUrl}/`)
  }
  if (process.env.ALLOWED_ORIGINS) {
    process.env.ALLOWED_ORIGINS.split(",").forEach((o) => {
      const trimmed = o.trim().replace(/\/+$/, "")
      if (trimmed) {
        allowedOrigins.push(trimmed)
        allowedOrigins.push(`${trimmed}/`)
      }
    })
  }

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

  logger.log("3. Middleware, CORS, filtros e pipes configurados.")

  const port = process.env.PORT || 8080
  await app.listen(port, "0.0.0.0")
  logger.log(`4. 🚀 Chegou.AI Core API iniciado com sucesso na porta ${port}`)
  logger.log(`🔗 API Base URL: http://localhost:${port}/api/v1`)
}

bootstrap().catch((err) => {
  console.error("FATAL BOOTSTRAP ERROR:", err)
  process.exit(1)
})