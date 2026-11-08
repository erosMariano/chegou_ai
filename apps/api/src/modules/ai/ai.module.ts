import { Module } from "@nestjs/common"
import { AiService } from "./ai.service"
import { AddressMatcherService } from "./address-matcher.service"
import { AiController } from "./ai.controller"

@Module({
  controllers: [AiController],
  providers: [AiService, AddressMatcherService],
  exports: [AiService, AddressMatcherService],
})
export class AiModule {}

