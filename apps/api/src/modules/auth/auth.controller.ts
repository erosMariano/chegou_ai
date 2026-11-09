import { Controller, Post, Body, Get, Param, UseGuards, Request, ForbiddenException } from "@nestjs/common"
import { AuthService } from "./auth.service"
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard"
import { Throttle } from "@nestjs/throttler"
import { LoginDto } from "./dto/login.dto"
import {
  ActivateAccountDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from "./dto/auth-requests.dto"

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // Anti-Brute-Force: máximo 5 tentativas por minuto
  async login(@Body() body: LoginDto) {
    return this.authService.login(body.email, body.password)
  }

  @Post("demo/:role")
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  async loginDemo(@Param("role") role: string) {
    if (process.env.NODE_ENV === "production") {
      throw new ForbiddenException("Login de demonstração indisponível em ambiente de produção.")
    }
    return this.authService.loginDemo(role)
  }

  @Post("logout")
  async logout() {
    return { success: true, message: "Sessão encerrada com sucesso." }
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  async getMe(@Request() req: any) {
    return this.authService.getMe(req.user.id)
  }

  @Post("activate")
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async activateAccount(@Body() body: ActivateAccountDto) {
    return this.authService.activateAccount(body.email, body.token, body.password)
  }

  @Post("forgot-password")
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.forgotPassword(body.email)
  }

  @Post("reset-password")
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body.email, body.token, body.newPassword)
  }
}
