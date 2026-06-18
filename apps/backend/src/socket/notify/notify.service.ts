import { Calendar, Notification, User } from '@lib/database';
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotifyGateway } from './notify.gateway';
import { SendNotificationDto } from '@lib/dto';
import { NOTIFICATION_STATUS } from '@lib/common';

@Injectable()
export class NotifyService {
  private logger = new Logger(NotifyService.name)
  constructor(
    @InjectModel(Calendar.name) private readonly calendarModel: Model<Calendar>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<Notification>,
    private readonly notificationGateway: NotifyGateway,
  ) { }
  async sendScheduleEventNotification(id: string, payload: any) {
    const { owner, attendees, ...rest } = await payload;


    const generateNotificationPayload = payload?.attendees.map((d: any) => ({
      notifier: d._id ?? d,
      data:
      {
        ...rest ?? null
      },
      redirectUrl: d?.meetingLink ?? null,
    }));

    const notificationData = await this.notificationModel.insertMany(
      generateNotificationPayload,
    );

    await this.notificationGateway.sendScheduleNotification(notificationData);

    return;
  }

  async populateUser(userId: string) {
    const user = await this.userModel.findById(userId).populate({
      path: 'userId',
    });

    return user;
  }

  async notifyUserWithoutDb(data: SendNotificationDto) {
    const actor = await this.populateUser(data.actor);

    const notificationData = {
      notifier: data?.notifier,
      actor: actor,
      type: data.type,
      status: NOTIFICATION_STATUS.REALTIME,
      data: {
        ...data.data,
      },
      redirectUrl: data?.redirectUrl,
    };

    return await this.notificationGateway.sendSingleNotification(
      notificationData,
    );
  }

  async notifyUserWithDb(data: SendNotificationDto) {
    // this.logger.log(data)
    const notificationData = await this.notificationModel.create({
      notifier: data?.notifier,
      actor: data?.actor,
      status: NOTIFICATION_STATUS.UNREAD,
      data: {
        ...data.data,
      },
      redirectUrl: data?.redirectUrl,
    });

    await notificationData.populate({
      path: 'actor',
      populate: {
        path: 'userId',
      },
    });

    return await this.notificationGateway.sendSingleNotification(
      notificationData,
    );
  }
}
