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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from "@nestjs/swagger"
import { UsersService } from "./users.service"
import { CreateUserDto, UpdateUserDto } from "./dto/user.dto"
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard"
import { RolesGuard } from "@/common/guards/roles.guard"
import { Roles } from "@/common/decorators/roles.decorator"
import { UserRole } from "@prisma/client"

@ApiTags("Users")
@ApiBearerAuth("JWT-auth")
@Controller("users")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: "Listagem de usuários do sistema", description: "Lista administradores e porteiros com paginação e busca por nome ou e-mail. Exclusivo para ADMIN." })
  @ApiQuery({ name: "role", enum: UserRole, required: false, description: "Filtro por papel (ADMIN ou PORTER)" })
  @ApiQuery({ name: "isActive", type: Boolean, required: false, description: "Filtro por status ativo/inativo" })
  @ApiQuery({ name: "search", type: String, required: false, description: "Busca textual por nome ou e-mail" })
  @ApiResponse({ status: 200, description: "Lista de usuários retornada com sucesso." })
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
  @ApiOperation({ summary: "Consulta usuário por ID", description: "Retorna detalhes do operador da portaria ou administrador." })
  @ApiResponse({ status: 200, description: "Usuário encontrado." })
  @ApiResponse({ status: 404, description: "Usuário não encontrado." })
  async findOne(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.usersService.findOne(id)
  }

  @Post()
  @ApiOperation({ summary: "Cadastro de operador/administrador", description: "Cria uma nova conta de acesso para porteiro ou síndico." })
  @ApiResponse({ status: 201, description: "Usuário criado com sucesso." })
  @ApiResponse({ status: 409, description: "E-mail já cadastrado." })
  async create(@Body() body: CreateUserDto) {
    return this.usersService.create(body)
  }

  @Put(":id")
  @ApiOperation({ summary: "Edição de dados do usuário", description: "Altera nome, e-mail ou redefine senha do operador." })
  @ApiResponse({ status: 200, description: "Usuário atualizado com sucesso." })
  async update(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() body: UpdateUserDto
  ) {
    return this.usersService.update(id, body)
  }

  @Patch(":id/toggle-status")
  @ApiOperation({ summary: "Alternar status ativo/inativo", description: "Inativa ou reativa o acesso de um operador sem deletar seu histórico de auditoria." })
  @ApiResponse({ status: 200, description: "Status alterado com sucesso." })
  async toggleStatus(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Request() req: any
  ) {
    return this.usersService.toggleStatus(id, req.user.id)
  }

  @Delete(":id")
  @ApiOperation({ summary: "Remoção de usuário", description: "Deleta o operador do banco. Se possuir encomendas vinculadas, desativa a conta ao invés de deleção física para preservar integridade referencial." })
  @ApiResponse({ status: 200, description: "Operador removido ou inativado com sucesso." })
  async remove(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Request() req: any
  ) {
    return this.usersService.remove(id, req.user.id)
  }
}

