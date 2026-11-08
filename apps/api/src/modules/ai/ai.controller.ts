import { Controller, Post, Body, UseGuards } from "@nestjs/common"
import { AiService } from "./ai.service"
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard"
import { RolesGuard } from "@/common/guards/roles.guard"
import { Roles } from "@/common/decorators/roles.decorator"
import { UserRole } from "@prisma/client"
import { Throttle } from "@nestjs/throttler"
import { ExtractLabelDto } from "./dto/extract-label.dto"

@Controller("bff/packages")
@UseGuards(JwtAuthGuard, RolesGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post("extract-label")
  @Roles(UserRole.PORTER, UserRole.ADMIN)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // Anti-DoS & Proteção de cota Gemini
  async extractLabel(@Body() body: ExtractLabelDto) {
    return this.aiService.extractLabelFromImage(body?.image, body?.mimeType || "image/jpeg")
  }
}
