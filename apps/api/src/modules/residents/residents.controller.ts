import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from "@nestjs/common"
import { ResidentsService, CreateResidentDto } from "./residents.service"
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard"
import { RolesGuard } from "@/common/guards/roles.guard"
import { Roles } from "@/common/decorators/roles.decorator"
import { UserRole } from "@prisma/client"

@Controller("residents")
export class ResidentsController {
  constructor(private readonly residentsService: ResidentsService) {}

  @Get()
  async findAll(@Query("unitId") unitId?: string) {
    return this.residentsService.findAll(unitId)
  }

  @Get("me/packages")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESIDENT, UserRole.ADMIN)
  async getMyPackages(@Request() req: any, @Query("status") status?: string) {
    return this.residentsService.getResidentPackages(req.user.email, status)
  }

  @Post("me/push-subscriptions")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESIDENT, UserRole.ADMIN, UserRole.PORTER)
  async registerPushSubscription(
    @Request() req: any,
    @Body() body: { endpoint: string; keys: { p256dh: string; auth: string }; userAgent?: string }
  ) {
    const residents = await this.residentsService.findAll(req.user.unitId)
    const found = residents.find((r) => r.email === req.user.email) || residents[0]
    const residentId = found ? found.id : req.user.id

    const subscription = await this.residentsService.savePushSubscription(residentId, body)
    return {
      subscriptionId: subscription.id,
      active: subscription.isValid,
    }
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    return this.residentsService.findOne(id)
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async create(@Body() body: CreateResidentDto) {
    return this.residentsService.create(body)
  }

  @Put(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async update(@Param("id") id: string, @Body() body: Partial<CreateResidentDto>) {
    return this.residentsService.update(id, body)
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async delete(@Param("id") id: string) {
    return this.residentsService.delete(id)
  }
}
