import { Controller, Post, Body, UseGuards } from "@nestjs/common"
import { AiService } from "./ai.service"
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard"
import { RolesGuard } from "@/common/guards/roles.guard"
import { Roles } from "@/common/decorators/roles.decorator"
import { UserRole } from "@prisma/client"

@Controller("bff/packages")
@UseGuards(JwtAuthGuard, RolesGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post("extract-label")
  @Roles(UserRole.PORTER, UserRole.ADMIN)
  async extractLabel(@Body() body: { image: string; mimeType?: string }) {
    return this.aiService.extractLabelFromImage(body.image, body.mimeType || "image/jpeg")
  }
}

