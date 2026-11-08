import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from "@nestjs/common"
import { CondominiumService } from "./condominium.service"
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard"
import { RolesGuard } from "@/common/guards/roles.guard"
import { Roles } from "@/common/decorators/roles.decorator"
import { UserRole } from "@prisma/client"
import { CreateCondominiumAddressDto, UpdateCondominiumAddressDto } from "./dto/condominium-address.dto"

@Controller("condominium")
@UseGuards(JwtAuthGuard, RolesGuard)
export class CondominiumController {
  constructor(private readonly condominiumService: CondominiumService) {}

  @Get("addresses")
  @Roles(UserRole.ADMIN, UserRole.PORTER, UserRole.RESIDENT)
  async listAddresses() {
    return this.condominiumService.listAddresses()
  }

  @Post("addresses")
  @Roles(UserRole.ADMIN)
  async createAddress(@Body() body: CreateCondominiumAddressDto) {
    return this.condominiumService.createAddress(body)
  }

  @Patch("addresses/:id")
  @Roles(UserRole.ADMIN)
  async updateAddress(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() body: UpdateCondominiumAddressDto
  ) {
    return this.condominiumService.updateAddress(id, body)
  }

  @Delete("addresses/:id")
  @Roles(UserRole.ADMIN)
  async deleteAddress(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.condominiumService.deleteAddress(id)
  }
}

