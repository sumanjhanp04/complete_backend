import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { NotifyService } from './notify.service';
import { INAPP_NOTIFICATION_TOPIC, NOTIFY_USERS_TOPIC } from '@lib/common';
import { RmqService } from '@lib/rmq';

import { Controller } from '@nestjs/common';
import { SendNotificationDto } from '@lib/dto';

@Controller()
export class NotifyController {

  constructor(
    // Service containing notification business logic
    private readonly notifyService: NotifyService,

    // RabbitMQ utility service (used for ACK)
    private readonly rmqService: RmqService,
  ) { }

  /**
   * ============================================================
   * Schedule Notification Consumer
   * ============================================================
   * Listens for scheduled notification events from RabbitMQ.
   *
   * Topic:
   * SEND_SCHEDULE_NOTIFICATION
   *
   * Example Payload:
   * {
   *   id: "123",
   *   payload: {
   *      title: "Meeting Reminder",
   *      message: "Meeting starts in 10 minutes"
   *   }
   * }
   */
  @MessagePattern({
    cmd: NOTIFY_USERS_TOPIC.SEND_SCHEDULE_NOTIFICATION,
  })
  async sendScheduleEventNotification(
    @Payload() data: { id: string; payload: any },

    // RabbitMQ message context
    @Ctx() context: RmqContext,
  ) {
    try {
      // Extract values from incoming payload
      const { id, payload } = data;

      // Trigger scheduled notification
      this.notifyService.sendScheduleEventNotification(
        id,
        payload,
      );

      // Acknowledge message to RabbitMQ
      this.rmqService.ack(context);

      return data;
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * ============================================================
   * Online User Notification Consumer
   * ============================================================
   * Sends notification to users.
   *
   * Topic:
   * SEND_ONLINE_USER_NOTIFICATION
   *
   * Example Payload:
   * {
   *   notifier: "user1",
   *   actor: "user2",
   *   title: "Task Assigned",
   *   message: "You have been assigned a task",
   *   saveToDb: true
   * }
   */
  @MessagePattern({
    cmd: NOTIFY_USERS_TOPIC.SEND_ONLINE_USER_NOTIFICATION,
  })
  async sendOnlineUserNotification(
    @Payload() data: SendNotificationDto,

    @Ctx() context: RmqContext,
  ) {
    try {
      // Check whether notification should be stored in DB
      const { saveToDb } = data;

      if (saveToDb) {

        /**
         * Store notification in MongoDB
         * + send realtime notification
         */
        await this.notifyService.notifyUserWithDb(data);

      } else {

        /**
         * Only send realtime notification
         * No database record created
         */
        await this.notifyService.notifyUserWithoutDb(data);
      }

      // Acknowledge RabbitMQ message
      this.rmqService.ack(context);

      return;
    } catch (error) {
      return error;
    }
  }

  /**
   * ============================================================
   * Realtime In-App Notification
   * ============================================================
   * Listens for realtime notification events.
   *
   * Topic:
   * SEND_REALTIME_NOTIFICATION
   *
   * Currently only logs payload.
   *
   * Example:
   * {
   *   userId: "123",
   *   title: "New Message",
   *   body: "You received a new chat message"
   * }
   */
  @MessagePattern({
    cmd: INAPP_NOTIFICATION_TOPIC.SEND_REALTIME_NOTIFICATION,
  })
  async sendRealTimeNotification(
    @Payload() payload: any,
  ) {
    console.log(payload);
  }
}