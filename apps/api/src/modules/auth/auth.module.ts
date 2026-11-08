import { Module } from "@nestjs/common"
import { JwtModule } from "@nestjs/jwt"
import { PassportModule } from "@nestjs/passport"
import { ConfigService } from "@nestjs/config"
import { AuthService } from "./auth.service"
import { AuthController } from "./auth.controller"
import { JwtStrategy } from "./jwt.strategy"

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>("JWT_SECRET")
        if (!secret && process.env.NODE_ENV === "production") {
          throw new Error("FATAL: JWT_SECRET não configurado em ambiente de produção!")
        }
        return {
          secret: secret || "chegou_ai_dev_jwt_secret_not_for_production_min32chars",
          signOptions: { expiresIn: "24h" }, // Reduzido de 7d para 24h
        }
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
