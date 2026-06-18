import { Module } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { CalendarController } from './calendar.controller';
import { DatabaseModule } from '@lib/database';
import { RmqModule } from '@lib/rmq';
import { CONVERSATION_SERVICE, SCHEDULER_SERVICE } from '@lib/common';
import { RedisCacheModule } from 'libs/cache/src';



@Module({
  imports: [
    DatabaseModule,
    RmqModule.register({ name: SCHEDULER_SERVICE }),
    RmqModule.register({ name: CONVERSATION_SERVICE }),
    RedisCacheModule,
  ],
  controllers: [CalendarController],
  providers: [CalendarService],
})
export class CalendarModule { }
