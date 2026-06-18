import { NestFactory } from '@nestjs/core';
import { SchedulerModule } from './scheduler.module';
import { RmqService } from '@lib/rmq';
import { SCHEDULER_SERVICE } from '@lib/common';

async function bootstrap() {
  const app = await NestFactory.create(SchedulerModule);

  const rmqService = app.get<RmqService>(RmqService);
  console.log(rmqService.getOptions(SCHEDULER_SERVICE));
  app.connectMicroservice(rmqService.getOptions(SCHEDULER_SERVICE));
  await app.startAllMicroservices();

  await app.listen(4000);
}
bootstrap();
