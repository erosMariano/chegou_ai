import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from "@nestjs/common"
import { Request, Response } from "express"

@Catch()
export class Rfc7807ExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    let status = HttpStatus.INTERNAL_SERVER_ERROR
    let title = "Internal Server Error"
    let detail = "Ocorreu um erro interno inesperado no servidor."
    let type = "https://chegou.ai/errors/internal-error"

    if (exception instanceof HttpException) {
      status = exception.getStatus()
      const res = exception.getResponse()

      if (typeof res === "string") {
        detail = res
        title = exception.name || "Erro na Requisição"
      } else if (typeof res === "object" && res !== null) {
        const anyRes = res as any
        title = anyRes.error || anyRes.title || exception.name
        detail = Array.isArray(anyRes.message)
          ? anyRes.message.join(", ")
          : anyRes.message || anyRes.detail || JSON.stringify(res)
        if (anyRes.type) type = anyRes.type
      }

      // Tipos customizados amigáveis
      if (status === 404) type = "https://chegou.ai/errors/not-found"
      else if (status === 409) type = "https://chegou.ai/errors/conflict"
      else if (status === 400) type = "https://chegou.ai/errors/validation-failed"
      else if (status === 401) type = "https://chegou.ai/errors/unauthorized"
      else if (status === 403) type = "https://chegou.ai/errors/forbidden"
    } else if (exception instanceof Error) {
      detail = exception.message
    }

    response.status(status).json({
      type,
      title,
      status,
      detail,
      instance: request.url,
      timestamp: new Date().toISOString(),
    })
  }
}

