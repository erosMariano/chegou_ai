import { Controller, Post, Body, Get, Param, UseGuards, Request, ForbiddenException } from "@nestjs/common"
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger"
import { AuthService } from "./auth.service"
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard"
import { Throttle } from "@nestjs/throttler"
import { LoginDto } from "./dto/login.dto"
import {
  ActivateAccountDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  SetupInitialAdminDto,
} from "./dto/auth-requests.dto"

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post("login")
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // Anti-Brute-Force: máximo 5 tentativas por minuto
  @ApiOperation({ summary: "Login com e-mail e senha", description: "Autentica síndico, porteiro ou morador e retorna token JWT." })
  @ApiResponse({ status: 200, description: "Login realizado com sucesso. Retorna dados do usuário e token JWT." })
  @ApiResponse({ status: 401, description: "Credenciais inválidas ou conta inativa." })
  async login(@Body() body: LoginDto) {
    return this.authService.login(body.email, body.password)
  }

  @Post("demo/:role")
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @ApiOperation({ summary: "Login rápido de demonstração (apenas ambiente dev/teste)", description: "Permite login direto como admin, porteiro ou morador sem informar senha." })
  @ApiResponse({ status: 200, description: "Sessão demo emitida com sucesso." })
  @ApiResponse({ status: 403, description: "Indisponível em produção." })
  async loginDemo(@Param("role") role: string) {
    if (process.env.NODE_ENV === "production") {
      throw new ForbiddenException("Login de demonstração indisponível em ambiente de produção.")
    }
    return this.authService.loginDemo(role)
  }

  @Post("logout")
  @ApiOperation({ summary: "Encerramento de sessão", description: "Revoga ou instrui o cliente a limpar a sessão." })
  @ApiResponse({ status: 200, description: "Sessão encerrada com sucesso." })
  async logout() {
    return { success: true, message: "Sessão encerrada com sucesso." }
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Dados do usuário autenticado", description: "Retorna o perfil, permissão e unidade do usuário do token atual." })
  @ApiResponse({ status: 200, description: "Dados do usuário retornado com sucesso." })
  @ApiResponse({ status: 401, description: "Não autenticado." })
  async getMe(@Request() req: any) {
    return this.authService.getMe(req.user.id)
  }

  @Get("setup-status")
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: "Verifica se o sistema já possui condomínio/administrador inicial", description: "Retorna { initialized: boolean } para controlar o onboarding inicial sem expor dados sensíveis." })
  @ApiResponse({ status: 200, description: "Status de inicialização retornado com sucesso." })
  async getSetupStatus() {
    return this.authService.getSetupStatus()
  }

  @Post("setup-initial-admin")
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: "Setup inicial do condomínio e síndico", description: "Auto-provisionamento do primeiro administrador quando o banco está zerado." })
  @ApiResponse({ status: 201, description: "Condomínio e síndico criados. Sessão retornada." })
  @ApiResponse({ status: 403, description: "Já existe administrador configurado." })
  async setupInitialAdmin(@Body() body: SetupInitialAdminDto) {
    return this.authService.setupInitialAdmin(body)
  }

  @Post("activate")
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: "Ativação de conta e primeiro acesso do morador", description: "Valida token de convite no Redis e cadastra a nova senha do condômino." })
  @ApiResponse({ status: 200, description: "Conta ativada e sessão JWT iniciada." })
  @ApiResponse({ status: 401, description: "Token inválido ou expirado." })
  @ApiResponse({ status: 409, description: "Conta já ativada anteriormente." })
  async activateAccount(@Body() body: ActivateAccountDto) {
    return this.authService.activateAccount(body.email, body.token, body.password)
  }

  @Post("forgot-password")
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: "Solicitação de recuperação de senha", description: "Gera token seguro no Redis e envia e-mail com link de redefinição." })
  @ApiResponse({ status: 200, description: "Instruções enviadas por e-mail." })
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.forgotPassword(body.email)
  }

  @Post("reset-password")
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: "Redefinição de senha com token", description: "Valida token temporário no Redis e cadastra nova senha do usuário." })
  @ApiResponse({ status: 200, description: "Senha redefinida com sucesso." })
  @ApiResponse({ status: 401, description: "Token de redefinição inválido ou expirado." })
  async resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body.email, body.token, body.newPassword)
  }
}
