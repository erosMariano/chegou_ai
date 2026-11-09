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
import { PackagesService, CreatePackageDto, CheckoutPackageDto } from "./packages.service"
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard"
import { RolesGuard } from "@/common/guards/roles.guard"
import { Roles } from "@/common/decorators/roles.decorator"
import { UserRole, PackageStatus } from "@prisma/client"
import { Throttle } from "@nestjs/throttler"

@Controller("packages")
@UseGuards(JwtAuthGuard, RolesGuard)
export class PackagesController {
  constructor(private readonly packagesService: PackagesService) {}

  @Post()
  @Roles(UserRole.PORTER, UserRole.ADMIN)
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
  async checkout(@Body() body: CheckoutPackageDto, @Request() req: any) {
    const userId = req.user.id
    return this.packagesService.checkoutPackage(body, userId)
  }

  @Get()
  @Roles(UserRole.PORTER, UserRole.ADMIN, UserRole.RESIDENT)
  async findAll(
    @Request() req: any,
    @Query("status") status?: PackageStatus | "PENDING",
    @Query("unitId") unitId?: string,
    @Query("search") search?: string,
    @Query("page") page?: number,
    @Query("limit") limit?: number
  ) {
    // Isolamento rigoroso de Tenant/Unidade (Prevenção BOLA / IDOR):
    // Se o usuário logado for MORADOR, filtra obrigatoriamente pela sua unidade do JWT
    let effectiveUnitId = unitId
    if (req.user?.role === UserRole.RESIDENT) {
      effectiveUnitId = req.user.unitId
    }

    const isResident = req.user?.role === UserRole.RESIDENT
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
  async cancelPackage(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() body: { reason?: string; notes?: string },
    @Request() req: any
  ) {
    return this.packagesService.cancelPackage(id, body?.reason, body?.notes, req.user?.id)
  }
}
