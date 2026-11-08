import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Headers,
  UseGuards,
  Request,
} from "@nestjs/common"
import { PackagesService, CreatePackageDto, CheckoutPackageDto } from "./packages.service"
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard"
import { RolesGuard } from "@/common/guards/roles.guard"
import { Roles } from "@/common/decorators/roles.decorator"
import { UserRole, PackageStatus } from "@prisma/client"

@Controller("packages")
export class PackagesController {
  constructor(private readonly packagesService: PackagesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PORTER, UserRole.ADMIN)
  async checkout(@Body() body: CheckoutPackageDto, @Request() req: any) {
    const userId = req.user.id
    return this.packagesService.checkoutPackage(body, userId)
  }

  @Get()
  async findAll(
    @Query("status") status?: PackageStatus | "PENDING",
    @Query("unitId") unitId?: string,
    @Query("search") search?: string,
    @Query("page") page?: number,
    @Query("limit") limit?: number
  ) {
    const res = await this.packagesService.findAll({ status, unitId, search, page, limit })
    // Se a requisição não especificou paginação, retorna direto a lista de itens para a UI
    if (!page) {
      return res.items
    }
    return res
  }

  @Get(":id")
  async getOne(@Param("id") id: string) {
    return this.packagesService.getOne(id)
  }
}
