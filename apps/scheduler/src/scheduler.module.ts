import { Module } from '@nestjs/common';
import { SchedulerController } from './scheduler.controller';
import { SchedulerService } from './scheduler.service';

import { DynamicCronModule } from '@app/dynamic-cron';

import { RmqModule, RmqService } from '@lib/rmq';
import { ConfigModule } from '@lib/config';
import { DatabaseModule } from '@lib/database';

import { CONVERSATION_SERVICE, NOTIFICATION_SERVICE } from '@lib/common';

/**
 * Scheduler Module
 *
 * Responsible for:
 * - Managing scheduled jobs
 * - Creating recurring cron tasks
 * - Communicating with other microservices
 * - Accessing database resources
 * - Using Dynamic Cron functionality
 */
@Module({
  imports: [
    /**
     * Configuration Module
     *
     * Loads environment variables and application settings.
     */
    ConfigModule,

    /**
     * Dynamic Cron Module
     *
     * Provides functionality to:
     * - Create cron jobs dynamically
     * - Update cron jobs
     * - Delete cron jobs
     * - Manage recurring events
     */
    DynamicCronModule,

    /**
     * Database Module
     *
     * Provides MongoDB connection
     * and database models.
     */
    DatabaseModule,

    /**
     * RabbitMQ Client Registration
     *
     * Creates a RabbitMQ client connection
     * for Notification Service.
     *
     * Used when Scheduler needs to send:
     * - Notifications
     * - Reminders
     * - Email triggers
     */
    RmqModule.register({
      name: NOTIFICATION_SERVICE,
    }),

    /**
     * RabbitMQ Client Registration
     *
     * Creates a RabbitMQ client connection
     * for Conversation Service.
     *
     * Used when Scheduler needs to send:
     * - Chat reminders
     * - Conversation events
     * - Follow-up messages
     */
    RmqModule.register({
      name: CONVERSATION_SERVICE,
    }),
  ],

  /**
   * Controllers
   *
   * Handle:
   * - HTTP requests
   * - RabbitMQ messages
   */
  controllers: [SchedulerController],

  /**
   * Providers
   *
   * SchedulerService:
   * Contains scheduler business logic.
   *
   * RmqService:
   * RabbitMQ helper utility.
   */
  providers: [RmqService, SchedulerService],
})
export class SchedulerModule {}
