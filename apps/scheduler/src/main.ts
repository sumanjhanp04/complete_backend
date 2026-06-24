import { NestFactory } from '@nestjs/core';
import { SchedulerModule } from './scheduler.module';
import { RmqService } from '@lib/rmq';
import { SCHEDULER_SERVICE } from '@lib/common';

/**
 * Application Entry Point
 *
 * This file starts the Scheduler Microservice.
 *
 * Responsibilities:
 * - Create NestJS application
 * - Connect RabbitMQ microservice
 * - Start RabbitMQ consumer
 * - Start HTTP server
 */
async function bootstrap() {
  /**
   * Create NestJS application
   *
   * Loads:
   * - SchedulerModule
   * - Controllers
   * - Services
   * - Cron Jobs
   * - RabbitMQ Configuration
   */
  const app = await NestFactory.create(SchedulerModule);

  /**
   * Get RmqService instance from NestJS DI container
   */
  const rmqService = app.get<RmqService>(RmqService);

  /**
   * Display RabbitMQ connection configuration
   *
   * Useful for debugging:
   * - Queue Name
   * - RabbitMQ URL
   * - Queue Options
   */
  console.log(rmqService.getOptions(SCHEDULER_SERVICE));

  /**
   * Connect RabbitMQ Microservice
   *
   * Creates RabbitMQ consumer connection.
   *
   * Queue:
   * SCHEDULER_SERVICE
   */
  app.connectMicroservice(rmqService.getOptions(SCHEDULER_SERVICE));

  /**
   * Start RabbitMQ listeners
   *
   * After this line:
   * - @MessagePattern() starts listening
   * - Scheduler service can receive messages
   */
  await app.startAllMicroservices();

  /**
   * Start HTTP server on port 4000
   *
   * Example:
   * http://localhost:4000
   */
  await app.listen(4000);

  console.log('🚀 Scheduler Service Running on Port 4000');
}

/**
 * Start Application
 */
bootstrap();
