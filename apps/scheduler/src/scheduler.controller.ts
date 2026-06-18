import { Controller, Get } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { SCHEDULER_MAPS } from '@lib/common/topics/maps/scheduler.maps';
import { RmqService } from '@lib/rmq';
import { SchedulerDto } from '@lib/dto';

@Controller()
export class SchedulerController {
  constructor(
    private readonly schedulerService: SchedulerService,
    private readonly rmqService: RmqService,
  ) {}

  @Get()
  getHello(): string {
    return this.schedulerService.getHello();
  }

  @MessagePattern({ cmd: SCHEDULER_MAPS.RECURRING_EVENT })
  async recurringScheduler(
    @Payload() data: SchedulerDto,
    @Ctx() context: RmqContext,
  ) {
    await this.schedulerService.scheduleRecurringEvent(data);
    this.rmqService.ack(context);
    return data;
  }

  @MessagePattern({ cmd: SCHEDULER_MAPS.DELETE_EVENT })
  async deleteScheduler(
    @Payload() data: { name: string },
    @Ctx() context: RmqContext,
  ) {
    await this.schedulerService.deleteScheduler(data);
    this.rmqService.ack(context);
    return data;
  }
}
