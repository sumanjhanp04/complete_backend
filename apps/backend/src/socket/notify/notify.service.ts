import { Calendar, Notification, User } from '@lib/database';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotifyGateway } from './notify.gateway';
import { SendNotificationDto } from '@lib/dto';
import { NOTIFICATION_STATUS } from '@lib/common';

@Injectable()
export class NotifyService {

  // Logger for debugging
  private logger = new Logger(NotifyService.name);

  constructor(

    /**
     * Calendar Collection
     */
    @InjectModel(Calendar.name)
    private readonly calendarModel: Model<Calendar>,

    /**
     * User Collection
     */
    @InjectModel(User.name)
    private readonly userModel: Model<User>,

    /**
     * Notification Collection
     */
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<Notification>,

    /**
     * Socket Gateway
     *
     * Used to send realtime notifications
     */
    private readonly notificationGateway: NotifyGateway,
  ) { }

  /**
   * =====================================================
   * Send Scheduled Event Notification
   * =====================================================
   *
   * Used by:
   * - Meeting Reminder
   * - Calendar Event Reminder
   * - Scheduled Tasks
   */
  async sendScheduleEventNotification(
    id: string,
    payload: any,
  ) {

    /**
     * Remove owner and attendees
     * Keep remaining event data
     */
    const { owner, attendees, ...rest } = payload;

    /**
     * Generate notification payload
     *
     * One notification per attendee
     */
    const generateNotificationPayload =
      payload?.attendees.map((d: any) => ({
        notifier: d._id ?? d,

        data: {
          ...rest ?? null,
        },

        redirectUrl:
          d?.meetingLink ?? null,
      }));

    /**
     * Save notifications in MongoDB
     */
    const notificationData =
      await this.notificationModel.insertMany(
        generateNotificationPayload,
      );

    /**
     * Send realtime notification
     */
    await this.notificationGateway
      .sendScheduleNotification(
        notificationData,
      );

    return;
  }

  /**
   * =====================================================
   * Populate User Details
   * =====================================================
   *
   * Used for actor information
   */
  async populateUser(userId: string) {

    const user = await this.userModel
      .findById(userId)
      .populate({
        path: 'userId',
      });

    return user;
  }

  /**
   * =====================================================
   * Notification Without Database Storage
   * =====================================================
   *
   * Realtime Only
   *
   * Examples:
   * - User Typing
   * - Temporary Alerts
   * - Live Updates
   */
  async notifyUserWithoutDb(
    data: SendNotificationDto,
  ) {

    /**
     * Get actor details
     */
    const actor =
      await this.populateUser(
        data.actor,
      );

    /**
     * Build notification object
     */
    const notificationData = {

      notifier: data.notifier,

      actor: actor,

      type: data.type,

      status:
        NOTIFICATION_STATUS.REALTIME,

      data: {
        ...data.data,
      },

      redirectUrl:
        data.redirectUrl,
    };

    /**
     * Send notification
     * through Socket.IO
     */
    return await this.notificationGateway
      .sendSingleNotification(
        notificationData,
      );
  }

  /**
   * =====================================================
   * Notification With Database Storage
   * =====================================================
   *
   * Examples:
   * - Task Assigned
   * - Leave Approved
   * - Meeting Reminder
   * - Comment Added
   */
  async notifyUserWithDb(
    data: SendNotificationDto,
  ) {

    /**
     * Create notification record
     */
    const notificationData =
      await this.notificationModel.create({

        notifier:
          data.notifier,

        actor:
          data.actor,

        status:
          NOTIFICATION_STATUS.UNREAD,

        data: {
          ...data.data,
        },

        redirectUrl:
          data.redirectUrl,
      });

    /**
     * Populate actor details
     */
    await notificationData.populate({
      path: 'actor',
      populate: {
        path: 'userId',
      },
    });

    /**
     * Send realtime notification
     */
    return await this.notificationGateway
      .sendSingleNotification(
        notificationData,
      );
  }
}