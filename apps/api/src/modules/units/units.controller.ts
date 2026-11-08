import { Controller, Get, Post, Put, Body, Param, UseGuards } from "@nestjs/common"
import { UnitsService } from "./units.service"
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard"
import { RolesGuard } from "@/common/guards/roles.guard"
import { Roles } from "@/common/decorators/roles.decorator"
import { UserRole } from "@prisma/client"

@Controller("units")
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  @Get()
  async findAll() {
    return this.unitsService.findAll()
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    return this.unitsService.findOne(id)
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async create(@Body() body: { block?: string; number: string }) {
    return this.unitsService.create(body)
  }

  @Put(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async update(
    @Param("id") id: string,
    @Body() body: { block?: string; number?: string; isActive?: boolean }
  ) {
    return this.unitsService.update(id, body)
  }
}
