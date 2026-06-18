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
    private readonly notifyService: NotifyService,
    private readonly rmqService: RmqService,
  ) { }

  @MessagePattern({ cmd: NOTIFY_USERS_TOPIC.SEND_SCHEDULE_NOTIFICATION })
  async sendScheduleEventNotification(
    @Payload() data: { id: string; payload: any },
    @Ctx() context: RmqContext,
  ) {
    try {
      const { id, payload } = data;


      this.notifyService.sendScheduleEventNotification(id, payload);
      this.rmqService.ack(context);
      return data;
    } catch (error) {

    }
  }

  @MessagePattern({ cmd: NOTIFY_USERS_TOPIC.SEND_ONLINE_USER_NOTIFICATION })
  async sendOnlineUserNotification(
    @Payload() data: SendNotificationDto,
    @Ctx() context: RmqContext,
  ) {
    try {
      const { saveToDb } = data;

      if (saveToDb) {
        await this.notifyService.notifyUserWithDb(data);
      } else {
        await this.notifyService.notifyUserWithoutDb(data);
      }

      this.rmqService.ack(context);
      return;
    } catch (error) {
      return error;
    }
  }



  @MessagePattern({ cmd: INAPP_NOTIFICATION_TOPIC.SEND_REALTIME_NOTIFICATION })
  async sendRealTimeNotification(@Payload() payload: any) {
    console.log(payload)
  }
}
