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
  private logger = new Logger(SchedulerService.name);
  constructor(
    private readonly dynamicCronService: DynamicCronService,
    @InjectModel(Calendar.name) private readonly calendarModel: Model<Calendar>,
    @InjectModel(CronTab.name) private readonly cronTabModel: Model<CronTab>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @Inject(CONVERSATION_SERVICE)
    private readonly notificationClient: ClientProxy,
    @Inject(NOTIFICATION_SERVICE)
    private readonly emailClient: ClientProxy,
  ) { }
  getHello(): string {
    return 'Hello World!';
  }

  async scheduleRecurringEvent(data: SchedulerDto) {

    if (data?.notifications.length == 0) return;
    const expiry = {
      expiryDate: data.expiryDate,
      count: data?.count,
    };
    data?.notifications.forEach((d) => {
      this.dynamicCronService.createCronJob(data.id, data, d, () => {
        this.recurringJobEvent(data.id);
      });
    });
  }

  async scheduleHolidayEvent(data: SchedulerDto) { }

  async specificDateEvent(data: SchedulerDto) { }

  //Basic Operations
  async deleteScheduler(data: { name: string }) {
    // return 'done'
    const res = this.dynamicCronService.deleteCronJob(data.name);
    const cronData = await this.cronTabModel.deleteOne({ cronId: data.name });


    return res;
  }

  async recurringJobEvent(id: string): Promise<void> {
    try {
      const existingCronTab = await this.cronTabModel.findOne({ cronId: id });
      const now = new Date();
      const cronExpiryDate = existingCronTab?.expireDate
        ? new Date(existingCronTab?.expireDate)
        : null;
      let runCount = 0;


      if (existingCronTab) {
        runCount = existingCronTab.runCount ? +existingCronTab.runCount : null; // Initialize runCount with the stored value
      }

      if (cronExpiryDate && now > new Date(cronExpiryDate)) {
        this.logger.log(
          `Event Expire with date ${existingCronTab?.expireDate}`,
        );
        await this.cronTabModel.deleteOne({ cronId: id });
        this.dynamicCronService.deleteCronJob(id); // Stop and delete the job if expired by date
      } else if (runCount && runCount >= +existingCronTab?.occurrence) {
        this.logger.log(
          `Event Expire with occurrence ${existingCronTab?.occurrence}`,
        );
        await this.cronTabModel.deleteOne({ cronId: id });
        this.dynamicCronService.deleteCronJob(id); // Stop and delete if max occurrences reached
      } else {
        runCount++;
        this.logger.log(
          `Event running with occurrence ${runCount} out of ${existingCronTab?.occurrence} on ${now} and have a expire date of ${existingCronTab?.expireDate}`,
        );
        const calendarData = await this.calendarModel.findById(id).exec();

        if (!calendarData) {
          this.logger.log(`Calendar event not found with id ${id}`);
          return;
        }

        if (calendarData.notifications.length === 0) {
          this.logger.log(
            `No notifications to send for calendar event with id ${id}`,
          );
          return;
        }

        const notificationPromises = calendarData?.notifications.map(
          async (notification) => {
            if (notification?.type === 'email') {
              this.logger.log(
                `Sending email notification for calendar event with id: ${id}`,
              );


              const users = await this.userModel
                .find({ _id: { $in: calendarData.attendees } })
                .populate('userId');


              const allEmailSchema = this.generateEmailSchema(
                users,
                calendarData,
              );

              await Promise.all(
                allEmailSchema.map(async (d) => {
                  try {
                    await this.emailClient
                      .send(
                        { cmd: NOTIFY_USERS_TOPIC.SEND_EMAIL },
                        { ...d }
                      )
                      .toPromise();
                    this.logger.log(`Email sent to ${d.to}`);
                  } catch (err) {
                    this.logger.error(`Error sending email to ${d.to}: ${err}`);
                  }
                }),
              );
            } else if (notification?.type === 'inApp') {
              this.logger.log(
                `Sending CRM notification for calendar event with id: ${id}`,
              );
              try {
                const res = await lastValueFrom(
                  this.notificationClient.send(
                    { cmd: NOTIFY_USERS_TOPIC.SEND_SCHEDULE_NOTIFICATION },
                    {
                      id,
                      payload: { ...calendarData.toObject() },
                    },
                  ),
                );

                if (!res) {
                  throw new RpcException('Failed to send CRM notification');
                }
              } catch (err) {
                this.logger.error(
                  `Error sending CRM notification for event id ${id}: ${err}`,
                );
              }
            }
          },
        );

        // Wait for all notifications to complete
        await Promise.all(notificationPromises);
        this.cronTabModel
          .findOneAndUpdate(
            { cronId: id },
            { runCount: runCount },
            { new: true },
          )
          .exec();
      }
    } catch (error) {
      this.logger.error(
        `Error in recurringJobEvent for calendar event with id ${id}:`,
        error,
      );
      throw error; // Re-throw the error to ensure proper handling upstream
    }
  }

  /**************  For Server restart*************************/
  private runCallback(id: string, type: string): () => void {
    switch (type) {
      case 'RECURRING':
        // Return a function that, when called, will execute this.recurringJobEvent(id)
        return () => this.recurringJobEvent(id);

      default:
        // Return a no-op function if the type does not match any known cases
        return () => { };
    }
  }

  private generateEmailSchema(users: any[], calendar: any) {
    return users?.map((d) => {
      // Ensure email, firstName, and lastName are available, otherwise default to empty strings
      const email = d?.userId?.email || '';
      const firstName = d?.userId?.firstName || '';
      const lastName = d?.userId?.lastName || '';
      const subject = calendar?.name || 'No Subject'; // Fallback for subject if calendar name is missing
      const description = calendar?.description?.toString() || ''; // Ensure description is a string

      // Replace placeholders with actual values
      const htmlContent = description
        .replaceAll('{{firstName}}', firstName)
        .replaceAll('{{lastName}}', lastName);

      // Create the email schema object
      const emailSchema = {
        to: email,
        subject: subject,
        html: htmlContent,
      };

      return emailSchema;
    });
  }
  async onModuleInit() {


    const cronData = await this.cronTabModel.find({ status: true });


    if (cronData?.length === 0) return;
    cronData?.forEach((d) => {
      this.dynamicCronService.rescheduleCronJob(
        d?.cronId,
        d?.cronExpression,
        this.runCallback(d?.cronId, d?.type),
      );
    });
  }
}
