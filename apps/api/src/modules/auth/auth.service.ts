import { Injectable, UnauthorizedException, NotFoundException } from "@nestjs/common"
import { JwtService } from "@nestjs/jwt"
import { PrismaService } from "@/prisma/prisma.service"
import * as bcrypt from "bcryptjs"
import { UserRole } from "@prisma/client"

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
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
}

