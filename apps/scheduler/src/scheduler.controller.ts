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

/**
 * Scheduler Controller
 *
 * Handles:
 * 1. HTTP Requests
 * 2. RabbitMQ Messages
 *
 * Works as the entry point for scheduler operations.
 */
@Controller()
export class SchedulerController {
  constructor(
    // Service containing scheduler business logic
    private readonly schedulerService: SchedulerService,

    // RabbitMQ utility service
    private readonly rmqService: RmqService,
  ) {}

  /**
   * Health Check API
   *
   * Route:
   * GET /
   *
   * Used to verify that the Scheduler service
   * is running properly.
   */
  @Get()
  getHello(): string {
    return this.schedulerService.getHello();
  }

  /**
   * RabbitMQ Consumer
   *
   * Listens for:
   * SCHEDULER_MAPS.RECURRING_EVENT
   *
   * Example message:
   * {
   *   name: "daily-report",
   *   cronExpression: "0 9 * * *"
   * }
   *
   * Purpose:
   * Create a recurring scheduled event.
   */
  @MessagePattern({
    cmd: SCHEDULER_MAPS.RECURRING_EVENT,
  })
  async recurringScheduler(
    // Data received from RabbitMQ
    @Payload() data: SchedulerDto,

    // RabbitMQ message context
    @Ctx() context: RmqContext,
  ) {
    // Create recurring scheduler job
    await this.schedulerService.scheduleRecurringEvent(data);

    // Acknowledge message so RabbitMQ removes it
    this.rmqService.ack(context);

    // Return received data
    return data;
  }

  /**
   * RabbitMQ Consumer
   *
   * Listens for:
   * SCHEDULER_MAPS.DELETE_EVENT
   *
   * Example message:
   * {
   *   name: "daily-report"
   * }
   *
   * Purpose:
   * Delete an existing scheduled event.
   */
  @MessagePattern({
    cmd: SCHEDULER_MAPS.DELETE_EVENT,
  })
  async deleteScheduler(
    // Event information received from RabbitMQ
    @Payload() data: { name: string },

    // RabbitMQ context
    @Ctx() context: RmqContext,
  ) {
    // Delete scheduled job
    await this.schedulerService.deleteScheduler(data);

    // Acknowledge successful processing
    this.rmqService.ack(context);

    // Return deleted event information
    return data;
  }
}
