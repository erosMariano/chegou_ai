import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
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

  async getSetupStatus(): Promise<{ initialized: boolean }> {
    const adminCount = await this.prisma.user.count({
      where: { role: UserRole.ADMIN },
    })
    return { initialized: adminCount > 0 }
  }

  async setupInitialAdmin(data: {
    condominiumName: string
    cnpj?: string
    name: string
    email: string
    password: string
    address?: {
      label?: string
      zipCode: string
      street: string
      number: string
      neighborhood: string
      city: string
      state: string
    }
  }) {
    // 1. Lock distribuído no Redis para prevenir Race Condition / TOCTOU
    const lockKey = "lock:setup_initial_admin"
    const acquired = await this.redis.setIfNotExists(lockKey, "locked", 30)
    if (!acquired) {
      throw new ConflictException("Configuração inicial já está sendo processada por outro terminal.")
    }

    try {
      // 2. Validação se já existe algum administrador cadastrado
      const adminCount = await this.prisma.user.count({
        where: { role: UserRole.ADMIN },
      })

      if (adminCount > 0) {
        throw new ForbiddenException(
          "O administrador inicial do condomínio já foi configurado. Acesse pelo login."
        )
      }

      const normalizedEmail = data.email.toLowerCase().trim()
      const existingUser = await this.prisma.user.findUnique({
        where: { email: normalizedEmail },
      })
      if (existingUser) {
        throw new ConflictException("Já existe um usuário cadastrado com este e-mail.")
      }

      // 3. Criação ou atualização do condomínio
      let condo = await this.prisma.condominium.findFirst()
      if (!condo) {
        condo = await this.prisma.condominium.create({
          data: {
            name: data.condominiumName.trim(),
            cnpj: data.cnpj?.trim() || null,
          },
        })
      } else {
        await this.prisma.condominium.update({
          where: { id: condo.id },
          data: {
            name: data.condominiumName.trim(),
            ...(data.cnpj ? { cnpj: data.cnpj.trim() } : {}),
          },
        })
      }

      // 4. Cadastro do endereço oficial principal (se informado no onboarding)
      if (data.address) {
        const cleanZip = data.address.zipCode.replace(/\D/g, "")
        const cleanState = data.address.state.toUpperCase().trim()
        const existingAddressCount = await this.prisma.condominiumAddress.count({
          where: { condominiumId: condo.id },
        })
        if (existingAddressCount === 0) {
          await this.prisma.condominiumAddress.create({
            data: {
              condominiumId: condo.id,
              label: data.address.label?.trim() || "Portaria Principal",
              zipCode: cleanZip,
              street: data.address.street.trim(),
              number: data.address.number.trim(),
              neighborhood: data.address.neighborhood.trim(),
              city: data.address.city.trim(),
              state: cleanState,
              addressAliases: [],
              isPrimary: true,
            },
          })
        }
      }

      // 5. Criação do primeiro usuário administrador (Síndico)
      const passwordHash = await bcrypt.hash(data.password, 10)
      const user = await this.prisma.user.create({
        data: {
          name: data.name.trim(),
          email: normalizedEmail,
          passwordHash,
          role: UserRole.ADMIN,
          isActive: true,
        },
      })

      return this.buildUserSession(user)
    } finally {
      await this.redis.del(lockKey)
    }
  }
}

