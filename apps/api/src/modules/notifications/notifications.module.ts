import { Global, Module } from "@nestjs/common"
import { RabbitMQService } from "./rabbitmq.service"
import { NotificationsService } from "./notifications.service"

@Global()
@Module({
  providers: [RabbitMQService, NotificationsService],
  exports: [RabbitMQService, NotificationsService],
})
export class NotificationsModule {}

