import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from "@nestjs/common"
import { UsersService } from "./users.service"
import { CreateUserDto, UpdateUserDto } from "./dto/user.dto"
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard"
import { RolesGuard } from "@/common/guards/roles.guard"
import { Roles } from "@/common/decorators/roles.decorator"
import { UserRole } from "@prisma/client"

@Controller("users")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(
    @Query("role") role?: UserRole,
    @Query("isActive") isActive?: string,
    @Query("search") search?: string,
    @Query("page") page?: number,
    @Query("limit") limit?: number
  ) {
    const activeBool =
      isActive === "true" ? true : isActive === "false" ? false : undefined
    return this.usersService.findAll({
      role,
      isActive: activeBool,
      search,
      page,
      limit,
    })
  }

  @Get(":id")
  async findOne(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.usersService.findOne(id)
  }

  @Post()
  async create(@Body() body: CreateUserDto) {
    return this.usersService.create(body)
  }

  @Put(":id")
  async update(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() body: UpdateUserDto
  ) {
    return this.usersService.update(id, body)
  }

  @Patch(":id/toggle-status")
  async toggleStatus(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Request() req: any
  ) {
    return this.usersService.toggleStatus(id, req.user.id)
  }

  @Delete(":id")
  async remove(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Request() req: any
  ) {
    return this.usersService.remove(id, req.user.id)
  }
}

