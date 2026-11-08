import { NestFactory } from "@nestjs/core"
import { ValidationPipe, Logger } from "@nestjs/common"
import { AppModule } from "./app.module"
import { Rfc7807ExceptionFilter } from "./common/filters/rfc7807-exception.filter"
import * as express from "express"

async function bootstrap() {
  const logger = new Logger("Bootstrap")
  const app = await NestFactory.create(AppModule)

  // Aumentar o limite para payload de imagens Base64 (max 10MB)
  app.use(express.json({ limit: "10mb" }))
  app.use(express.urlencoded({ limit: "10mb", extended: true }))

  // CORS habilitado para o Front-end Next.js
  app.enableCors({
    origin: [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      /^http:\/\/192\.168\.\d+\.\d+:3000$/,
      /^http:\/\/10\.\d+\.\d+\.\d+:3000$/,
    ],
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
      forbidNonWhitelisted: false,
    })
  )

  const port = process.env.PORT || 8080
  await app.listen(port, "0.0.0.0")
  logger.log(`🚀 Chegou.AI Core API iniciado com sucesso na porta ${port}`)
  logger.log(`🔗 API Base URL: http://localhost:${port}/api/v1`)
}

bootstrap()

