import { DynamicCronService } from '@app/dynamic-cron';
import {
  CONVERSATION_SERVICE,
  NOTIFICATION_SERVICE,
  NOTIFY_USERS_TOPIC,
} from '@lib/common';
import { Calendar, CronTab, User } from '@lib/database';
import { SchedulerDto } from '@lib/dto';
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class SchedulerService implements OnModuleInit {
  // Logger for debugging and monitoring
  private logger = new Logger(SchedulerService.name);

  constructor(
    // Service used to create/delete/reschedule cron jobs dynamically
    private readonly dynamicCronService: DynamicCronService,

    // Calendar MongoDB model
    @InjectModel(Calendar.name)
    private readonly calendarModel: Model<Calendar>,

    // CronTab MongoDB model
    @InjectModel(CronTab.name)
    private readonly cronTabModel: Model<CronTab>,

    // User MongoDB model
    @InjectModel(User.name)
    private readonly userModel: Model<User>,

    // RabbitMQ client for sending in-app notifications
    @Inject(CONVERSATION_SERVICE)
    private readonly notificationClient: ClientProxy,

    // RabbitMQ client for sending email notifications
    @Inject(NOTIFICATION_SERVICE)
    private readonly emailClient: ClientProxy,
  ) {}

  /**
   * Test API response
   */
  getHello(): string {
    return 'Hello World!';
  }

  /**
   * Creates recurring cron jobs for all notifications
   * attached to a calendar event.
   */
  async scheduleRecurringEvent(data: SchedulerDto) {
    // No notifications means no cron required
    if (data?.notifications.length == 0) return;

    const expiry = {
      expiryDate: data.expiryDate,
      count: data?.count,
    };

    // Create separate cron jobs for each notification rule
    data?.notifications.forEach((d) => {
      this.dynamicCronService.createCronJob(data.id, data, d, () => {
        this.recurringJobEvent(data.id);
      });
    });
  }

  /**
   * Future implementation for holidays
   */
  async scheduleHolidayEvent(data: SchedulerDto) {}

  /**
   * Future implementation for specific date schedules
   */
  async specificDateEvent(data: SchedulerDto) {}

  /**
   * Delete an existing scheduler job
   */
  async deleteScheduler(data: { name: string }) {
    // Remove cron from memory
    const res = this.dynamicCronService.deleteCronJob(data.name);

    // Remove cron record from database
    await this.cronTabModel.deleteOne({
      cronId: data.name,
    });

    return res;
  }

  /**
   * Main cron execution method
   * Runs whenever a scheduled cron job is triggered.
   */
  async recurringJobEvent(id: string): Promise<void> {
    try {
      // Fetch cron metadata
      const existingCronTab = await this.cronTabModel.findOne({
        cronId: id,
      });

      const now = new Date();

      // Expiry date of cron job
      const cronExpiryDate = existingCronTab?.expireDate
        ? new Date(existingCronTab.expireDate)
        : null;

      let runCount = 0;

      // Current execution count
      if (existingCronTab) {
        runCount = existingCronTab.runCount ? +existingCronTab.runCount : null;
      }

      /**
       * Expiry Date Validation
       */
      if (cronExpiryDate && now > cronExpiryDate) {
        this.logger.log(`Event expired on ${existingCronTab?.expireDate}`);

        await this.cronTabModel.deleteOne({
          cronId: id,
        });

        // Remove cron permanently
        this.dynamicCronService.deleteCronJob(id);
      } else if (runCount && runCount >= +existingCronTab?.occurrence) {

      /**
       * Occurrence Count Validation
       */
        this.logger.log(
          `Event reached max occurrence ${existingCronTab?.occurrence}`,
        );

        await this.cronTabModel.deleteOne({
          cronId: id,
        });

        this.dynamicCronService.deleteCronJob(id);
      } else {

      /**
       * Execute Notification Logic
       */
        runCount++;

        this.logger.log(
          `Running occurrence ${runCount}/${existingCronTab?.occurrence}`,
        );

        // Load calendar event
        const calendarData = await this.calendarModel.findById(id);

        if (!calendarData) {
          this.logger.log(`Calendar event not found: ${id}`);
          return;
        }

        // No notifications configured
        if (calendarData.notifications.length === 0) {
          return;
        }

        /**
         * Process all notification types
         */
        const notificationPromises = calendarData.notifications.map(
          async (notification) => {
            /**
             * EMAIL NOTIFICATION
             */
            if (notification?.type === 'email') {
              const users = await this.userModel
                .find({
                  _id: {
                    $in: calendarData.attendees,
                  },
                })
                .populate('userId');

              // Generate personalized emails
              const allEmailSchema = this.generateEmailSchema(
                users,
                calendarData,
              );

              await Promise.all(
                allEmailSchema.map(async (d) => {
                  try {
                    await this.emailClient
                      .send(
                        {
                          cmd: NOTIFY_USERS_TOPIC.SEND_EMAIL,
                        },
                        { ...d },
                      )
                      .toPromise();

                    this.logger.log(`Email sent to ${d.to}`);
                  } catch (err) {
                    this.logger.error(`Failed sending email to ${d.to}`);
                  }
                }),
              );
            } else if (notification?.type === 'inApp') {

            /**
             * IN-APP NOTIFICATION
             */
              try {
                const res = await lastValueFrom(
                  this.notificationClient.send(
                    {
                      cmd: NOTIFY_USERS_TOPIC.SEND_SCHEDULE_NOTIFICATION,
                    },
                    {
                      id,
                      payload: {
                        ...calendarData.toObject(),
                      },
                    },
                  ),
                );

                if (!res) {
                  throw new RpcException('Failed to send notification');
                }
              } catch (err) {
                this.logger.error(`Notification failed for event ${id}`);
              }
            }
          },
        );

        // Wait until all notifications complete
        await Promise.all(notificationPromises);

        // Update execution count
        await this.cronTabModel.findOneAndUpdate(
          { cronId: id },
          { runCount },
          { new: true },
        );
      }
    } catch (error) {
      this.logger.error(`Recurring job failed for event ${id}`, error);

      throw error;
    }
  }

  /**
   * Generates callback function
   * used when cron jobs are restored after restart.
   */
  private runCallback(id: string, type: string): () => void {
    switch (type) {
      case 'RECURRING':
        return () => this.recurringJobEvent(id);

      default:
        return () => {};
    }
  }

  /**
   * Generates personalized email payloads
   * for all attendees.
   */
  private generateEmailSchema(users: any[], calendar: any) {
    return users?.map((d) => {
      const email = d?.userId?.email || '';

      const firstName = d?.userId?.firstName || '';

      const lastName = d?.userId?.lastName || '';

      const subject = calendar?.name || 'No Subject';

      const description = calendar?.description?.toString() || '';

      // Replace template placeholders
      const htmlContent = description
        .replaceAll('{{firstName}}', firstName)
        .replaceAll('{{lastName}}', lastName);

      return {
        to: email,
        subject,
        html: htmlContent,
      };
    });
  }

  /**
   * Runs automatically when server starts.
   *
   * Purpose:
   * Restore all active cron jobs
   * from MongoDB after server restart.
   */
  async onModuleInit() {
    const cronData = await this.cronTabModel.find({
      status: true,
    });

    if (cronData?.length === 0) return;

    cronData.forEach((d) => {
      this.dynamicCronService.rescheduleCronJob(
        d.cronId,
        d.cronExpression,
        this.runCallback(d.cronId, d.type),
      );
    });
  }
}
