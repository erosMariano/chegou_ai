import { Controller, Post, Body, Get, Param, UseGuards, Request } from "@nestjs/common"
import { AuthService } from "./auth.service"
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard"

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  async login(@Body() body: { email: string; password?: string }) {
    return this.authService.login(body.email, body.password || "123456")
  }

  @Post("demo/:role")
  async loginDemo(@Param("role") role: string) {
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
}

