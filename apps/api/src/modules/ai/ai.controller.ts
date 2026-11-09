import { Controller, Post, Body, UseGuards } from "@nestjs/common"
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger"
import { AiService } from "./ai.service"
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard"
import { RolesGuard } from "@/common/guards/roles.guard"
import { Roles } from "@/common/decorators/roles.decorator"
import { UserRole } from "@prisma/client"
import { Throttle } from "@nestjs/throttler"
import { ExtractLabelDto } from "./dto/extract-label.dto"

@ApiTags("BFF / AI")
@ApiBearerAuth("JWT-auth")
@Controller("bff/packages")
@UseGuards(JwtAuthGuard, RolesGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post("extract-label")
  @Roles(UserRole.PORTER, UserRole.ADMIN)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // Anti-DoS & Proteção de cota Gemini
  @ApiOperation({ summary: "OCR e extração zero-shot de etiquetas com Gemini", description: "Envia imagem em Base64 para o modelo Gemini 2.5 Flash, extrai destinatário, bloco, número e valida correspondência com os endereços oficiais do condomínio." })
  @ApiResponse({ status: 201, description: "Etiqueta lida e dados extraídos com score de confiança." })
  @ApiResponse({ status: 422, description: "Imagem ilegível ou etiqueta não encontrada." })
  async extractLabel(@Body() body: ExtractLabelDto) {
    return this.aiService.extractLabelFromImage(body?.image, body?.mimeType || "image/jpeg")
  }
}
