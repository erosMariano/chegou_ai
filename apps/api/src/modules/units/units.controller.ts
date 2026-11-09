import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, ParseUUIDPipe } from "@nestjs/common"
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger"
import { UnitsService } from "./units.service"
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard"
import { OptionalJwtAuthGuard } from "@/common/guards/optional-jwt-auth.guard"
import { RolesGuard } from "@/common/guards/roles.guard"
import { Roles } from "@/common/decorators/roles.decorator"
import { UserRole } from "@prisma/client"
import { CreateUnitDto, UpdateUnitDto } from "./dto/unit.dto"

@ApiTags("Units")
@Controller("units")
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: "Listagem de unidades do condomínio", description: "Retorna blocos e números de apartamentos. Em conformidade com a LGPD, oculta nomes e contatos de moradores para requisições não autenticadas ou moradores comuns." })
  @ApiResponse({ status: 200, description: "Lista de unidades retornada com sucesso." })
  async findAll(@Request() req: any) {
    // LGPD: Moradores e requisições públicas/SSR recebem apenas a lista de unidades (bloco e número) sem dados pessoais dos condôminos
    const canViewResidents = req.user?.role === UserRole.ADMIN || req.user?.role === UserRole.PORTER
    return this.unitsService.findAll(canViewResidents)
  }

  @Get("template-csv")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Template CSV para importação de unidades", description: "Retorna cabeçalho e exemplos para preenchimento de planilha de blocos/apartamentos." })
  @ApiResponse({ status: 200, description: "String com template CSV." })
  async getTemplateCsv() {
    return { csv: this.unitsService.getTemplateCsv() }
  }

  @Post("import-batch")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Carga em lote de unidades via CSV", description: "Cadastra múltiplos blocos e apartamentos ignorando duplicatas." })
  @ApiResponse({ status: 201, description: "Unidades importadas com sucesso." })
  async importBatch(@Body() body: { items: Array<{ block?: string; number: string }> }) {
    return this.unitsService.importBatch(body?.items || [])
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PORTER, UserRole.RESIDENT)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Consulta detalhes da unidade", description: "Retorna informações do apartamento e seus moradores vinculados (morador só vê sua própria unidade)." })
  @ApiResponse({ status: 200, description: "Dados da unidade encontrados." })
  @ApiResponse({ status: 404, description: "Unidade não encontrada." })
  async findOne(@Param("id", new ParseUUIDPipe()) id: string, @Request() req: any) {
    const isOwnUnit = req.user?.role === UserRole.RESIDENT && req.user?.unitId === id
    const canViewResidents = req.user?.role === UserRole.ADMIN || req.user?.role === UserRole.PORTER || isOwnUnit
    return this.unitsService.findOne(id, canViewResidents)
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Criação de unidade individual", description: "Cadastra um bloco e número de apartamento." })
  @ApiResponse({ status: 201, description: "Unidade cadastrada com sucesso." })
  @ApiResponse({ status: 409, description: "Unidade com mesmo bloco e número já existe." })
  async create(@Body() body: CreateUnitDto) {
    return this.unitsService.create(body)
  }

  @Put(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Edição de unidade", description: "Atualiza bloco, número ou status ativo da unidade." })
  @ApiResponse({ status: 200, description: "Unidade atualizada com sucesso." })
  async update(@Param("id", new ParseUUIDPipe()) id: string, @Body() body: UpdateUnitDto) {
    return this.unitsService.update(id, body)
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Remoção de unidade", description: "Exclui a unidade se não possuir moradores ou encomendas associadas." })
  @ApiResponse({ status: 200, description: "Unidade removida com sucesso." })
  @ApiResponse({ status: 400, description: "Não é possível remover unidade com moradores ou histórico de encomendas." })
  async remove(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.unitsService.remove(id)
  }
}
