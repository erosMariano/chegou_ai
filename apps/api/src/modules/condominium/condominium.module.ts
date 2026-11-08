import { Module } from "@nestjs/common"
import { CondominiumService } from "./condominium.service"
import { CondominiumController } from "./condominium.controller"
import { PrismaModule } from "@/prisma/prisma.module"

@Module({
  imports: [PrismaModule],
  controllers: [CondominiumController],
  providers: [CondominiumService],
  exports: [CondominiumService],
})
export class CondominiumModule {}

