import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from "@nestjs/common"
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger"
import { CondominiumService } from "./condominium.service"
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard"
import { RolesGuard } from "@/common/guards/roles.guard"
import { Roles } from "@/common/decorators/roles.decorator"
import { UserRole } from "@prisma/client"
import { CreateCondominiumAddressDto, UpdateCondominiumAddressDto } from "./dto/condominium-address.dto"
import { UpdateCondominiumProfileDto } from "./dto/update-condo-profile.dto"

@ApiTags("Condominium")
@ApiBearerAuth("JWT-auth")
@Controller("condominium")
@UseGuards(JwtAuthGuard, RolesGuard)
export class CondominiumController {
  constructor(private readonly condominiumService: CondominiumService) {}

  @Get("profile")
  @Roles(UserRole.ADMIN, UserRole.PORTER, UserRole.RESIDENT)
  @ApiOperation({ summary: "Perfil institucional do condomínio", description: "Retorna nome, CNPJ e configurações gerais." })
  @ApiResponse({ status: 200, description: "Dados do condomínio retornados com sucesso." })
  async getProfile() {
    return this.condominiumService.getProfile()
  }

  @Put("profile")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Atualização cadastral do condomínio", description: "Altera nome e CNPJ do condomínio. Exclusivo para ADMIN." })
  @ApiResponse({ status: 200, description: "Perfil atualizado com sucesso." })
  @ApiResponse({ status: 403, description: "Acesso negado para não-administradores." })
  async updateProfile(@Body() body: UpdateCondominiumProfileDto) {
    return this.condominiumService.updateProfile(body)
  }

  @Get("addresses")
  @Roles(UserRole.ADMIN, UserRole.PORTER, UserRole.RESIDENT)
  @ApiOperation({ summary: "Listagem de endereços oficiais", description: "Retorna todos os endereços físicos e aliases cadastrados para o condomínio." })
  @ApiResponse({ status: 200, description: "Lista de endereços oficiais retornada com sucesso." })
  async listAddresses() {
    return this.condominiumService.listAddresses()
  }

  @Post("addresses")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Cadastro de novo endereço oficial", description: "Cadastra uma portaria ou entrada secundária com apelidos de endereço para validação por IA." })
  @ApiResponse({ status: 201, description: "Endereço cadastrado com sucesso." })
  @ApiResponse({ status: 403, description: "Acesso restrito ao síndico/administrador." })
  async createAddress(@Body() body: CreateCondominiumAddressDto) {
    return this.condominiumService.createAddress(body)
  }

  @Patch("addresses/:id")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Edição de endereço oficial", description: "Atualiza logradouro, número, CEP ou aliases de um endereço cadastrado." })
  @ApiResponse({ status: 200, description: "Endereço atualizado com sucesso." })
  @ApiResponse({ status: 404, description: "Endereço não encontrado." })
  async updateAddress(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() body: UpdateCondominiumAddressDto
  ) {
    return this.condominiumService.updateAddress(id, body)
  }

  @Delete("addresses/:id")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Remoção de endereço oficial", description: "Exclui um endereço secundário. Garante que haja pelo menos 1 endereço principal ativo." })
  @ApiResponse({ status: 200, description: "Endereço excluído com sucesso." })
  @ApiResponse({ status: 400, description: "O condomínio não pode ficar sem nenhum endereço oficial." })
  async deleteAddress(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.condominiumService.deleteAddress(id)
  }
}

