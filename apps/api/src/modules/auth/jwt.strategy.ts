import { Injectable, UnauthorizedException } from "@nestjs/common"
import { PassportStrategy } from "@nestjs/passport"
import { ExtractJwt, Strategy } from "passport-jwt"
import { ConfigService } from "@nestjs/config"
import { PrismaService } from "@/prisma/prisma.service"

export interface JwtPayload {
  sub: string
  email: string
  role: string
  unitId?: string
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService
  ) {
    const jwtSecret = config.get<string>("JWT_SECRET")
    if (process.env.NODE_ENV === "production" && (!jwtSecret || jwtSecret.length < 32)) {
      throw new Error("FATAL: JWT_SECRET seguro (>= 32 chars) é obrigatório em produção.")
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret || "chegou_ai_super_secret_jwt_key_development_2026",
    })
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    })

    if (!user || !user.isActive) {
      throw new UnauthorizedException("Usuário não encontrado ou inativo.")
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      unitId: user.unitId,
    }
  }
}

