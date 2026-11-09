import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { APP_GUARD } from "@nestjs/core"
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler"
import { PrismaModule } from "./prisma/prisma.module"
import { RedisModule } from "./common/redis/redis.module"
import { NotificationsModule } from "./modules/notifications/notifications.module"
import { AuthModule } from "./modules/auth/auth.module"
import { UnitsModule } from "./modules/units/units.module"
import { ResidentsModule } from "./modules/residents/residents.module"
import { PackagesModule } from "./modules/packages/packages.module"
import { AiModule } from "./modules/ai/ai.module"
import { AuditModule } from "./modules/audit/audit.module"
import { CondominiumModule } from "./modules/condominium/condominium.module"
import { UsersModule } from "./modules/users/users.module"

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env", "../../.env"],
    }),
    ThrottlerModule.forRoot([
      {
        name: "default",
        ttl: 60000,
        limit: 120, // Proteção global DoS: 120 req/min por IP
      },
    ]),
    PrismaModule,
    RedisModule,
    NotificationsModule,
    AuthModule,
    UnitsModule,
    ResidentsModule,
    PackagesModule,
    AiModule,
    AuditModule,
    CondominiumModule,
    UsersModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
