import { Module } from '@nestjs/common';
import { DynamicCronService } from './dynamic-cron.service';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from '@lib/database';

@Module({
  imports: [DatabaseModule, ScheduleModule.forRoot()],
  providers: [DynamicCronService],
  exports: [DynamicCronService],
})
export class DynamicCronModule {}
