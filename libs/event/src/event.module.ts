import { Module } from '@nestjs/common';
import { EventService } from './event.service';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    EventEmitterModule.forRoot()
  ],
  providers: [EventService],
  exports: [EventEmitterModule],
})
export class EventModule { }
