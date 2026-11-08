import { Controller, Get, Post, Put, Body, Param, UseGuards, Request, ParseUUIDPipe } from "@nestjs/common"
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
  async findAll(@Request() req: any) {
    // LGPD: Moradores recebem apenas a lista de unidades (bloco e número) sem dados pessoais dos condôminos
    const canViewResidents = req.user?.role === UserRole.ADMIN || req.user?.role === UserRole.PORTER
    return this.unitsService.findAll(canViewResidents)
  }

  @Get(":id")
  @Roles(UserRole.ADMIN, UserRole.PORTER, UserRole.RESIDENT)
  async findOne(@Param("id", new ParseUUIDPipe()) id: string, @Request() req: any) {
    // Morador só pode ver dados de moradores se a unidade consultada for a sua própria
    const isOwnUnit = req.user?.role === UserRole.RESIDENT && req.user?.unitId === id
    const canViewResidents = req.user?.role === UserRole.ADMIN || req.user?.role === UserRole.PORTER || isOwnUnit
    return this.unitsService.findOne(id, canViewResidents)
  }

  @Post()
  @Roles(UserRole.ADMIN)
  async create(@Body() body: CreateUnitDto) {
    return this.unitsService.create(body)
  }

  @Put(":id")
  @Roles(UserRole.ADMIN)
  async update(@Param("id", new ParseUUIDPipe()) id: string, @Body() body: UpdateUnitDto) {
    return this.unitsService.update(id, body)
  }
}
