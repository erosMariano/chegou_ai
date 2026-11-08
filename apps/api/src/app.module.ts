import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { PrismaModule } from "./prisma/prisma.module"
import { RedisModule } from "./common/redis/redis.module"
import { NotificationsModule } from "./modules/notifications/notifications.module"
import { AuthModule } from "./modules/auth/auth.module"
import { UnitsModule } from "./modules/units/units.module"
import { ResidentsModule } from "./modules/residents/residents.module"
import { PackagesModule } from "./modules/packages/packages.module"
import { AiModule } from "./modules/ai/ai.module"
import { AuditModule } from "./modules/audit/audit.module"

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env", "../../.env"],
    }),
    PrismaModule,
    RedisModule,
    NotificationsModule,
    AuthModule,
    UnitsModule,
    ResidentsModule,
    PackagesModule,
    AiModule,
    AuditModule,
  ],
})
export class AppModule {}

