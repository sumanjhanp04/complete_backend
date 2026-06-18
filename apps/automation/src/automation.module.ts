import { Module } from '@nestjs/common';
import { AutomationController } from './automation.controller';
import { AutomationService } from './automation.service';
import { BullModule } from '@nestjs/bullmq';
import { AutomationProcessor } from './automation.processor';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: '110.225.25.2',
        port: 6379,
        password: 'Pasdt1234',
      },
    }),
    BullModule.registerQueue({
      name: 'jobQueue2',
    }),
  ],
  controllers: [AutomationController],
  providers: [AutomationService, AutomationProcessor],
})
export class AutomationModule {}
