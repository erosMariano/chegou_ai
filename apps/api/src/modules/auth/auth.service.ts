import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { JwtService } from "@nestjs/jwt"
import { PrismaService } from "@/prisma/prisma.service"
import { RedisService } from "@/common/redis/redis.service"
import { MailService } from "@/common/mail/mail.service"
import * as bcrypt from "bcryptjs"
import { randomBytes } from "crypto"
import { UserRole } from "@prisma/client"

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly redis: RedisService,
    private readonly config: ConfigService,
    private readonly mailService: MailService
  ) {}

  async login(email: string, pass: string) {
    const normalizedEmail = (email || "").toLowerCase().trim()
    let user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (!user) {
      // Morador cadastrado pelo síndico que ainda não possui registro em User
      const resident = await this.prisma.resident.findFirst({
        where: { email: normalizedEmail },
      })

      if (resident) {
        const passwordHash = await bcrypt.hash("123456", 10)
        user = await this.prisma.user.create({
          data: {
            name: resident.fullName,
            email: resident.email,
            passwordHash,
            role: UserRole.RESIDENT,
            unitId: resident.unitId,
            isActive: true,
          },
        })
      }
    }

    if (!user || !user.isActive) {
      throw new UnauthorizedException("Credenciais inválidas ou conta inativa.")
    }

    const isMatch = await bcrypt.compare(pass, user.passwordHash)
    if (!isMatch) {
      throw new UnauthorizedException(
        "Credenciais inválidas. Para novos moradores, a senha inicial padrão é 123456."
      )
    }

    return this.buildUserSession(user)
  }

  async loginDemo(roleParam: string) {
    const roleLower = roleParam.toLowerCase()
    let targetRole: UserRole

    if (roleLower === "admin" || roleLower === "sindico") {
      targetRole = UserRole.ADMIN
    } else if (roleLower === "porter" || roleLower === "porteiro") {
      targetRole = UserRole.PORTER
    } else if (roleLower === "resident" || roleLower === "morador") {
      targetRole = UserRole.RESIDENT
    } else {
      throw new NotFoundException(`Perfil demo '${roleParam}' não suportado.`)
    }

    const user = await this.prisma.user.findFirst({
      where: { role: targetRole, isActive: true },
    })

    if (!user) {
      throw new NotFoundException(`Nenhum usuário de demonstração encontrado com o perfil ${targetRole}.`)
    }

    return this.buildUserSession(user)
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new NotFoundException("Usuário não encontrado.")
    }

    let unit = null
    let residentId = null

    if (user.role === UserRole.RESIDENT && user.unitId) {
      const dbUnit = await this.prisma.unit.findUnique({
        where: { id: user.unitId },
      })
      if (dbUnit) {
        unit = {
          unitId: dbUnit.id,
          block: dbUnit.block,
          number: dbUnit.number,
        }
      }

      const resident = await this.prisma.resident.findFirst({
        where: { email: user.email },
      })
      if (resident) {
        residentId = resident.id
      }
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      unitId: user.unitId || undefined,
      unit: unit || undefined,
      residentId: residentId || undefined,
    }
  }

  private async buildUserSession(user: { id: string; name: string; email: string; role: UserRole; unitId: string | null }) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      unitId: user.unitId || undefined,
    }

    const token = this.jwtService.sign(payload)

    let unit = null
    let residentId = null

    if (user.role === UserRole.RESIDENT && user.unitId) {
      const dbUnit = await this.prisma.unit.findUnique({
        where: { id: user.unitId },
      })
      if (dbUnit) {
        unit = {
          unitId: dbUnit.id,
          block: dbUnit.block,
          number: dbUnit.number,
        }
      }

      const resident = await this.prisma.resident.findFirst({
        where: { email: user.email },
      })
      if (resident) {
        residentId = resident.id
      }
    }

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        unitId: user.unitId || undefined,
        unit: unit || undefined,
        residentId: residentId || undefined,
      },
      token,
    }
  }

  async activateAccount(email: string, token: string, pass: string) {
    const normalizedEmail = (email || "").toLowerCase().trim()
    const cleanToken = (token || "").trim()

    if (!cleanToken) {
      throw new BadRequestException("Token de ativação é obrigatório.")
    }

    // 1. Validação estrita do token de convite no Redis
    const storedToken = await this.redis.get(`auth:invite_token:${normalizedEmail}`)
    if (!storedToken || storedToken !== cleanToken) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: normalizedEmail },
      })
      if (existingUser && existingUser.isActive) {
        throw new ConflictException(
          "Esta conta já se encontra ativa. Acesse pelo login ou utilize a recuperação de senha."
        )
      }
      throw new UnauthorizedException(
        "Token de ativação inválido ou expirado. Solicite um novo convite à administração do condomínio."
      )
    }

    // 2. Busca cadastro de morador
    const resident = await this.prisma.resident.findFirst({
      where: { email: normalizedEmail },
    })

    if (!resident) {
      throw new NotFoundException("Cadastro de morador não encontrado para este e-mail.")
    }

    const passwordHash = await bcrypt.hash(pass, 10)

    let user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (user) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash, isActive: true },
      })
    } else {
      user = await this.prisma.user.create({
        data: {
          name: resident.fullName,
          email: resident.email,
          passwordHash,
          role: UserRole.RESIDENT,
          unitId: resident.unitId,
          isActive: true,
        },
      })
    }

    // 3. Invalidação imediata do token de convite após ativação com sucesso (anti-replay)
    await this.redis.del(`auth:invite_token:${normalizedEmail}`)

    return this.buildUserSession(user)
  }

  async forgotPassword(email: string) {
    const normalizedEmail = (email || "").toLowerCase().trim()
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (!user) {
      return {
        message: "Se o e-mail estiver cadastrado, as instruções para redefinição foram geradas.",
      }
    }

    // Token criptograficamente seguro com expiração de 15 minutos armazenado no Redis
    const token = randomBytes(32).toString("hex")
    await this.redis.set(`auth:reset_token:${normalizedEmail}`, token, 900)

    const appUrl =
      this.config.get<string>("FRONTEND_URL") ||
      this.config.get<string>("NEXT_PUBLIC_APP_URL") ||
      "http://localhost:3000"
    const cleanAppUrl = appUrl.trim().replace(/\/+$/, "")
    const resetUrl = `${cleanAppUrl}/redefinir-senha?token=${token}&email=${encodeURIComponent(normalizedEmail)}`

    // Despacha e-mail de redefinição via Resend
    this.mailService
      .sendPasswordResetEmail({
        to: user.email,
        userName: user.name,
        resetUrl,
      })
      .catch((err) => {
        this.logger.error(`Falha ao despachar e-mail de recuperação via Resend: ${err.message}`)
      })

    return {
      message: "Se o e-mail estiver cadastrado, as instruções para redefinição foram geradas.",
      resetToken: token,
      resetUrl,
    }
  }

  async resetPassword(email: string, token: string, pass: string) {
    const normalizedEmail = (email || "").toLowerCase().trim()
    const cleanToken = (token || "").trim()

    if (!cleanToken) {
      throw new BadRequestException("Token de validação é obrigatório.")
    }

    const storedToken = await this.redis.get(`auth:reset_token:${normalizedEmail}`)
    if (!storedToken || storedToken !== cleanToken) {
      throw new UnauthorizedException(
        "Token de redefinição inválido ou expirado. Por favor, solicite uma nova redefinição."
      )
    }

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (!user) {
      throw new NotFoundException("Usuário não encontrado.")
    }

    const passwordHash = await bcrypt.hash(pass, 10)
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    })

    // Invalidação imediata do token para prevenir Replay Attack
    await this.redis.del(`auth:reset_token:${normalizedEmail}`)

    return { success: true, message: "Senha redefinida com sucesso. Faça login com sua nova senha." }
  }
}

