import { Controller, Get, Post, Put, Body, Param, UseGuards } from "@nestjs/common"
import { UnitsService } from "./units.service"
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard"
import { RolesGuard } from "@/common/guards/roles.guard"
import { Roles } from "@/common/decorators/roles.decorator"
import { UserRole } from "@prisma/client"
import { CreateUnitDto, UpdateUnitDto } from "./dto/unit.dto"

@Controller("units")
@UseGuards(JwtAuthGuard, RolesGuard)
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.PORTER, UserRole.RESIDENT)
  async findAll() {
    return this.unitsService.findAll()
  }

  @Get(":id")
  @Roles(UserRole.ADMIN, UserRole.PORTER, UserRole.RESIDENT)
  async findOne(@Param("id") id: string) {
    return this.unitsService.findOne(id)
  }

  @Post()
  @Roles(UserRole.ADMIN)
  async create(@Body() body: CreateUnitDto) {
    return this.unitsService.create(body)
  }

  @Put(":id")
  @Roles(UserRole.ADMIN)
  async update(@Param("id") id: string, @Body() body: UpdateUnitDto) {
    return this.unitsService.update(id, body)
  }
}
