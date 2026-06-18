import { NestFactory } from '@nestjs/core';
import { NotificationModule } from './notification.module';
import { RmqService } from '@lib/rmq';
import { NOTIFICATION_SERVICE } from '@lib/common';

async function bootstrap() {
  const app = await NestFactory.create(NotificationModule);

  // microservice configuration
  const rmqService = app.get<RmqService>(RmqService);
  app.connectMicroservice(rmqService.getOptions(NOTIFICATION_SERVICE));
  await app.startAllMicroservices();
  // await app.listen(3000);
}
bootstrap();
