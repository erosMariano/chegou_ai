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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from "@nestjs/swagger"
import { ResidentsService, CreateResidentDto } from "./residents.service"
import { UpdateResidentDto } from "./dto/create-resident.dto"
import { RegisterPushSubscriptionDto } from "./dto/push-subscription.dto"
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard"
import { RolesGuard } from "@/common/guards/roles.guard"
import { Roles } from "@/common/decorators/roles.decorator"
import { UserRole } from "@prisma/client"

@ApiTags("Residents")
@ApiBearerAuth("JWT-auth")
@Controller("residents")
@UseGuards(JwtAuthGuard, RolesGuard)
export class ResidentsController {
  constructor(private readonly residentsService: ResidentsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.PORTER) // Proteção LGPD: apenas funcionários da portaria e síndico
  @ApiOperation({ summary: "Listagem de moradores", description: "Lista moradores com filtro opcional por unidade. Protegido por LGPD (apenas ADMIN e PORTER)." })
  @ApiQuery({ name: "unitId", required: false, description: "ID UUID da unidade para filtrar moradores de um apartamento específico" })
  @ApiResponse({ status: 200, description: "Lista de moradores retornada com sucesso." })
  async findAll(@Query("unitId") unitId?: string) {
    return this.residentsService.findAll(unitId)
  }

  @Get("me/packages")
  @Roles(UserRole.RESIDENT, UserRole.ADMIN)
  @ApiOperation({ summary: "Encomendas do morador autenticado", description: "Retorna a lista de pacotes associados ao apartamento do condômino logado, incluindo status e PIN/QR Code de retirada." })
  @ApiQuery({ name: "status", required: false, description: "Filtrar por PENDING, RECEIVED, DELIVERED ou CANCELLED" })
  @ApiResponse({ status: 200, description: "Lista de encomendas do morador." })
  async getMyPackages(@Request() req: any, @Query("status") status?: string) {
    return this.residentsService.getResidentPackages(req.user.email, status)
  }

  @Post("me/push-subscriptions")
  @Roles(UserRole.RESIDENT)
  @ApiOperation({ summary: "Registro de Web Push Subscription", description: "Salva a chave pública e endpoint VAPID do navegador do morador para recebimento de alertas push em tempo real." })
  @ApiResponse({ status: 201, description: "Inscrição Web Push registrada com sucesso." })
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

  @Get("template-csv")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Template CSV para importação de moradores", description: "Retorna modelo CSV com colunas de bloco, número, nome, email e telefone." })
  @ApiResponse({ status: 200, description: "String com template CSV." })
  async getTemplateCsv() {
    return { csv: this.residentsService.getTemplateCsv() }
  }

  @Post("import-batch")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Importação em lote de moradores via CSV", description: "Importa múltiplos condôminos e vincula automaticamente às unidades correspondentes." })
  @ApiResponse({ status: 201, description: "Relatório de importação com total processado e criados." })
  async importBatch(
    @Body()
    body: {
      items: Array<{
        block?: string
        number: string
        fullName: string
        email: string
        phone?: string
        isPrimary?: boolean
      }>
    }
  ) {
    return this.residentsService.importBatch(body?.items || [])
  }

  @Get(":id")
  @Roles(UserRole.ADMIN, UserRole.PORTER)
  @ApiOperation({ summary: "Consulta morador por ID", description: "Retorna dados do condômino." })
  @ApiResponse({ status: 200, description: "Morador encontrado." })
  @ApiResponse({ status: 404, description: "Morador não encontrado." })
  async findOne(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.residentsService.findOne(id)
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Cadastro individual de morador", description: "Cadastra morador e envia e-mail automático com link de convite para ativação de conta." })
  @ApiResponse({ status: 201, description: "Morador cadastrado com sucesso." })
  async create(@Body() body: CreateResidentDto) {
    return this.residentsService.create(body)
  }

  @Put(":id")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Edição de cadastro do morador", description: "Atualiza nome, telefone, documento ou unidade do condômino." })
  @ApiResponse({ status: 200, description: "Morador atualizado com sucesso." })
  async update(@Param("id", new ParseUUIDPipe()) id: string, @Body() body: UpdateResidentDto) {
    return this.residentsService.update(id, body)
  }

  @Delete(":id")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Remoção de morador", description: "Exclui o cadastro do condômino e sua respectiva conta de acesso." })
  @ApiResponse({ status: 200, description: "Morador excluído com sucesso." })
  async delete(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.residentsService.delete(id)
  }

  @Post(":id/invite")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Geração de convite de ativação de conta", description: "Gera token criptográfico seguro de 256 bits no Redis (TTL 7 dias) e dispara e-mail com link de ativação." })
  @ApiResponse({ status: 201, description: "Convite gerado. Retorna token e inviteUrl." })
  async generateInvite(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.residentsService.generateInvite(id)
  }
}
