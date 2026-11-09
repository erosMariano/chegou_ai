import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, ParseUUIDPipe } from "@nestjs/common"
import { UnitsService } from "./units.service"
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard"
import { OptionalJwtAuthGuard } from "@/common/guards/optional-jwt-auth.guard"
import { RolesGuard } from "@/common/guards/roles.guard"
import { Roles } from "@/common/decorators/roles.decorator"
import { UserRole } from "@prisma/client"
import { CreateUnitDto, UpdateUnitDto } from "./dto/unit.dto"

@Controller("units")
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  async findAll(@Request() req: any) {
    // LGPD: Moradores e requisições públicas/SSR recebem apenas a lista de unidades (bloco e número) sem dados pessoais dos condôminos
    const canViewResidents = req.user?.role === UserRole.ADMIN || req.user?.role === UserRole.PORTER
    return this.unitsService.findAll(canViewResidents)
  }

  @Get("template-csv")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getTemplateCsv() {
    return { csv: this.unitsService.getTemplateCsv() }
  }

  @Post("import-batch")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async importBatch(@Body() body: { items: Array<{ block?: string; number: string }> }) {
    return this.unitsService.importBatch(body?.items || [])
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PORTER, UserRole.RESIDENT)
  async findOne(@Param("id", new ParseUUIDPipe()) id: string, @Request() req: any) {
    // Morador só pode ver dados de moradores se a unidade consultada for a sua própria
    const isOwnUnit = req.user?.role === UserRole.RESIDENT && req.user?.unitId === id
    const canViewResidents = req.user?.role === UserRole.ADMIN || req.user?.role === UserRole.PORTER || isOwnUnit
    return this.unitsService.findOne(id, canViewResidents)
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async create(@Body() body: CreateUnitDto) {
    return this.unitsService.create(body)
  }

  @Put(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async update(@Param("id", new ParseUUIDPipe()) id: string, @Body() body: UpdateUnitDto) {
    return this.unitsService.update(id, body)
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async remove(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.unitsService.remove(id)
  }
}
