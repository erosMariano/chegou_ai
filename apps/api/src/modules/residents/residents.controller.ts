import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common"
import { ResidentsService, CreateResidentDto } from "./residents.service"
import { UpdateResidentDto } from "./dto/create-resident.dto"
import { RegisterPushSubscriptionDto } from "./dto/push-subscription.dto"
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard"
import { RolesGuard } from "@/common/guards/roles.guard"
import { Roles } from "@/common/decorators/roles.decorator"
import { UserRole } from "@prisma/client"

@Controller("residents")
@UseGuards(JwtAuthGuard, RolesGuard)
export class ResidentsController {
  constructor(private readonly residentsService: ResidentsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.PORTER) // Proteção LGPD: apenas funcionários da portaria e síndico
  async findAll(@Query("unitId") unitId?: string) {
    return this.residentsService.findAll(unitId)
  }

  @Get("me/packages")
  @Roles(UserRole.RESIDENT, UserRole.ADMIN)
  async getMyPackages(@Request() req: any, @Query("status") status?: string) {
    return this.residentsService.getResidentPackages(req.user.email, status)
  }

  @Post("me/push-subscriptions")
  @Roles(UserRole.RESIDENT)
  async registerPushSubscription(
    @Request() req: any,
    @Body() body: RegisterPushSubscriptionDto
  ) {
    if (!req.user.unitId) {
      throw new ForbiddenException("Apenas moradores vinculados a uma unidade podem receber notificações push de encomenda.")
    }

    const residents = await this.residentsService.findAll(req.user.unitId)
    const found = residents.find((r) => r.email.toLowerCase() === req.user.email.toLowerCase())
    if (!found) {
      throw new NotFoundException("Cadastro de morador não encontrado para esta conta.")
    }

    const subscription = await this.residentsService.savePushSubscription(found.id, body)
    return {
      subscriptionId: subscription.id,
      active: subscription.isValid,
    }
  }

  @Get(":id")
  @Roles(UserRole.ADMIN, UserRole.PORTER)
  async findOne(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.residentsService.findOne(id)
  }

  @Post()
  @Roles(UserRole.ADMIN)
  async create(@Body() body: CreateResidentDto) {
    return this.residentsService.create(body)
  }

  @Put(":id")
  @Roles(UserRole.ADMIN)
  async update(@Param("id", new ParseUUIDPipe()) id: string, @Body() body: UpdateResidentDto) {
    return this.residentsService.update(id, body)
  }

  @Delete(":id")
  @Roles(UserRole.ADMIN)
  async delete(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.residentsService.delete(id)
  }
}
