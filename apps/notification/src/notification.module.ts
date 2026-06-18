import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { EmailModule } from './api/email/email.module';
import { ConfigModule } from '@lib/config';
import { RmqService } from '@lib/rmq';

@Module({
  imports: [ConfigModule, EmailModule],
  controllers: [NotificationController],
  providers: [NotificationService, RmqService],
})
export class NotificationModule {}
