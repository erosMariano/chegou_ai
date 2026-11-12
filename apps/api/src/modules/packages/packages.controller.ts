import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Headers,
  UseGuards,
  Request,
  ForbiddenException,
  ParseUUIDPipe,
} from "@nestjs/common"
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiHeader } from "@nestjs/swagger"
import { PackagesService, CreatePackageDto, CheckoutPackageDto } from "./packages.service"
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard"
import { RolesGuard } from "@/common/guards/roles.guard"
import { Roles } from "@/common/decorators/roles.decorator"
import { UserRole, PackageStatus } from "@prisma/client"
import { Throttle } from "@nestjs/throttler"

@ApiTags("Packages")
@ApiBearerAuth("JWT-auth")
@Controller("packages")
@UseGuards(JwtAuthGuard, RolesGuard)
export class PackagesController {
  constructor(private readonly packagesService: PackagesService) {}

  @Post()
  @Roles(UserRole.PORTER, UserRole.ADMIN)
  @ApiOperation({ summary: "Check-in de nova encomenda", description: "Registra encomenda na portaria com geração atômica de PIN de 6 dígitos e QR Code. Suporta Idempotência via Redis." })
  @ApiHeader({ name: "idempotency-key", required: false, description: "Chave única de idempotência para evitar duplicidade de pacote em caso de retransmissão de rede." })
  @ApiResponse({ status: 201, description: "Encomenda recebida e evento registrado." })
  async create(
    @Body() body: CreatePackageDto,
    @Headers("idempotency-key") idempotencyKeyHeader: string,
    @Request() req: any
  ) {
    const userId = req.user.id
    return this.packagesService.createPackage(body, idempotencyKeyHeader, userId)
  }

  @Post("checkout")
  @Roles(UserRole.PORTER, UserRole.ADMIN)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // Anti-Brute-Force & Proteção contra DoS de CPU
  @ApiOperation({ summary: "Baixa / Retirada da encomenda", description: "Valida o PIN de 6 dígitos ou QR Token com comparação segura por hash bcrypt e Optimistic Locking. Transiciona status para DELIVERED." })
  @ApiResponse({ status: 201, description: "Encomenda baixada e entregue com sucesso." })
  @ApiResponse({ status: 404, description: "Código de retirada incorreto ou encomenda não encontrada." })
  @ApiResponse({ status: 409, description: "Encomenda já foi retirada anteriormente (Anti-Replay)." })
  async checkout(@Body() body: CheckoutPackageDto, @Request() req: any) {
    const userId = req.user.id
    return this.packagesService.checkoutPackage(body, userId)
  }

  @Get()
  @Roles(UserRole.PORTER, UserRole.ADMIN, UserRole.RESIDENT)
  @ApiOperation({ summary: "Listagem de encomendas", description: "Lista encomendas com paginação e busca. Se requisitado por morador, isola estritamente à sua própria unidade do JWT (Anti-BOLA/IDOR)." })
  @ApiQuery({ name: "status", required: false, description: "Status: PENDING, RECEIVED, NOTIFIED, DELIVERED, CANCELLED" })
  @ApiQuery({ name: "unitId", required: false, description: "Filtro por ID de unidade (apenas síndico e porteiro)" })
  @ApiQuery({ name: "search", required: false, description: "Busca por destinatário, código de rastreio ou transportadora" })
  @ApiResponse({ status: 200, description: "Lista de encomendas retornada com sucesso." })
  async findAll(
    @Request() req: any,
    @Query("status") status?: PackageStatus | "PENDING",
    @Query("unitId") unitId?: string,
    @Query("search") search?: string,
    @Query("page") page?: number,
    @Query("limit") limit?: number
  ) {
    const isResident = req.user?.role === UserRole.RESIDENT
    if (isResident && !req.user?.unitId) {
      if (!page) {
        return []
      }
      const safePage = Math.max(Number(page) || 1, 1)
      const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100)
      return { items: [], total: 0, page: safePage, limit: safeLimit, totalPages: 0 }
    }

    let effectiveUnitId = unitId
    if (isResident) {
      effectiveUnitId = req.user.unitId
    }
    const res = await this.packagesService.findAll({
      status,
      unitId: effectiveUnitId,
      search,
      page,
      limit,
      isResident,
    })

    if (!page) {
      return res.items
    }
    return res
  }

  @Get(":id")
  @Roles(UserRole.PORTER, UserRole.ADMIN, UserRole.RESIDENT)
  @ApiOperation({ summary: "Consulta encomenda por ID", description: "Retorna dados da encomenda. Morador só visualiza se pertencer à sua própria unidade." })
  @ApiResponse({ status: 200, description: "Encomenda encontrada." })
  @ApiResponse({ status: 403, description: "Morador tentando visualizar encomenda de outro apartamento." })
  @ApiResponse({ status: 404, description: "Encomenda não encontrada." })
  async getOne(@Param("id", new ParseUUIDPipe()) id: string, @Request() req: any) {
    const isResident = req.user?.role === UserRole.RESIDENT
    const pkg = await this.packagesService.getOne(id, isResident)
    if (isResident && pkg.unitId !== req.user.unitId) {
      throw new ForbiddenException("Você não possui permissão para visualizar encomendas de outra unidade.")
    }
    return pkg
  }

  @Patch(":id/cancel")
  @Roles(UserRole.PORTER, UserRole.ADMIN)
  @ApiOperation({ summary: "Cancelamento ou devolução à transportadora", description: "Invalida os códigos de retirada e transiciona status para CANCELLED com motivo gravado na auditoria." })
  @ApiResponse({ status: 200, description: "Encomenda cancelada com sucesso." })
  @ApiResponse({ status: 409, description: "Encomenda já entregue ou já cancelada." })
  async cancelPackage(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() body: { reason?: string; notes?: string },
    @Request() req: any
  ) {
    return this.packagesService.cancelPackage(id, body?.reason, body?.notes, req.user?.id)
  }
}
