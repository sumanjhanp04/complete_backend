import { Module } from '@nestjs/common';
import { SchedulerController } from './scheduler.controller';
import { SchedulerService } from './scheduler.service';
import { DynamicCronModule } from '@app/dynamic-cron';
import { RmqModule, RmqService } from '@lib/rmq';
import { ConfigModule } from '@lib/config';
import { DatabaseModule } from '@lib/database';
import { CONVERSATION_SERVICE, NOTIFICATION_SERVICE } from '@lib/common';

@Module({
  imports: [
    ConfigModule,
    DynamicCronModule,
    DatabaseModule,
    RmqModule.register({ name: NOTIFICATION_SERVICE }),
    RmqModule.register({ name: CONVERSATION_SERVICE }),
  ],
  controllers: [SchedulerController],
  providers: [RmqService, SchedulerService],
})
export class SchedulerModule {}
