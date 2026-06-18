import { CALENDAR_EVENT_TYPE, CronTab } from '@lib/database';
import { SchedulerDto } from '@lib/dto';
import { HttpException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { Model } from 'mongoose';

@Injectable()
export class DynamicCronService {
  private logger = new Logger(DynamicCronService.name)
  constructor(
    private schedulerRegistry: SchedulerRegistry,
    @InjectModel(CronTab.name) private readonly cronTabModel: Model<CronTab>

  ) { }

  // Function to create a cron job for recurring events
  async createCronJob(name: string, recurringEvent: SchedulerDto, notification: any, callback: () => void) {

    let cronExpression: string;

    if (recurringEvent.type === CALENDAR_EVENT_TYPE.HOLIDAY || recurringEvent?.type === CALENDAR_EVENT_TYPE.OPTIONAL_HOLIDAY) {
      cronExpression = this.generateCronExpressionForSpecificDate(recurringEvent.specificDate, notification);
    } else {
      cronExpression = this.generateCronExpression(recurringEvent, notification);
    }





    const job = new CronJob(cronExpression, callback);



    this.schedulerRegistry.addCronJob(name, job);

    await this.cronTabModel.create({
      cronId: name,
      cronExpression: cronExpression,
      occurrence: recurringEvent?.expiryDate ?? null,
      runCount: '0',
      expireDate: recurringEvent?.expiryDate ?? null,
      type: 'RECURRING'
    })

    job.start();


  }

  async rescheduleCronJob(name: string, expression: string, callback: () => void) {
    const job = new CronJob(expression, callback);



    this.schedulerRegistry.addCronJob(name, job);

    console.log(job);


    job.start();

  }

  // Function to schedule an event on a specific date
  // scheduleEventOnSpecificDate(
  //   name: string,
  //   date: string,
  //   callback: () => void,
  // ) {
  //   const cronExpression = this.generateCronExpressionForSpecificDate(date);
  //   const job = new CronJob(cronExpression, callback);

  //   this.schedulerRegistry.addCronJob(name, job);
  //   job.start();
  // }

  // Function to stop a cron job
  stopCronJob(name: string) {
    const job = this.schedulerRegistry.getCronJob(name);
    job.stop();
  }

  // Function to delete a cron job
  deleteCronJob(name: string) {

    try {


      // return;
      const isCronExist = this.checkCronAvailability(name)


      if (!isCronExist) {
        this.logger.log('No Cron Found with this name')
        return;
      }
      this.schedulerRegistry.deleteCronJob(name);
    } catch (error) {
      this.logger.error(error)
      return;
    }
  }

  // Private function to generate cron expression for recurring events
  //   private generateCronExpression(event: any): string {
  //     const { frequency, interval, daysOfWeek } = event;

  //     let cronExpression = '';

  //     switch (frequency) {
  //       case 'daily':
  //         cronExpression = `0 0 */${interval || 1} * *`;
  //         break;
  //       case 'weekly':
  //         if (daysOfWeek && daysOfWeek.length > 0) {
  //           const days = daysOfWeek
  //             .map((day) => {
  //               const dayMap = {
  //                 Sunday: 0,
  //                 Monday: 1,
  //                 Tuesday: 2,
  //                 Wednesday: 3,
  //                 Thursday: 4,
  //                 Friday: 5,
  //                 Saturday: 6,
  //               };
  //               return dayMap[day];
  //             })
  //             .join(',');
  //           cronExpression = `0 0 * * ${days}`;
  //         } else {
  //           cronExpression = `0 0 * * 0`;
  //         }
  //         break;
  //       case 'monthly':
  //         cronExpression = `0 0 1 */${interval || 1} *`;
  //         break;
  //       case 'yearly':
  //         cronExpression = `0 0 1 1 */${interval || 1}`;
  //         break;
  //       default:
  //         throw new Error('Invalid frequency');
  //     }

  //     return cronExpression;
  //   }
  private generateCronExpression(
    event: SchedulerDto,
    notification: any
  ): string {


    const { frequency, interval, daysOfWeek, startTime } = event;



    const { timeUnit, reminder } = notification;


    const reminderBeforeMinutes = this.convertToMinutes(reminder, timeUnit); // Convert reminder to minutes


    let cronExpression = '';

    // Default start time to "00:00" if not provided
    const [startHour = 0, startMinute = 0] = startTime ? startTime.split(':').map(Number) : [0, 0];



    switch (frequency) {
      case 'daily':
        if (interval) {
          cronExpression = this.adjustCronForReminder(
            `${startMinute} ${startHour} */${interval} * *`,
            +reminderBeforeMinutes,
          );
        } else {
          cronExpression = this.adjustCronForReminder(
            `${startMinute} ${startHour} * * *`,
            +reminderBeforeMinutes,
          );
        }
        break;

      case 'weekly':
        if (daysOfWeek && daysOfWeek.length > 0) {
          const days = daysOfWeek
            .map((day) => {
              const dayMap = {
                Sunday: 0,
                Monday: 1,
                Tuesday: 2,
                Wednesday: 3,
                Thursday: 4,
                Friday: 5,
                Saturday: 6,
              };
              return dayMap[day];
            })
            .join(',');

          cronExpression = this.adjustCronForReminder(
            `${startMinute} ${startHour} * * ${days}`,
            +reminderBeforeMinutes,
          );
        } else {
          cronExpression = this.adjustCronForReminder(
            `${startMinute} ${startHour} * * 0`,
            +reminderBeforeMinutes,
          );
        }
        break;

      case 'monthly':
        if (interval) {

          cronExpression = this.adjustCronForReminder(
            `${startMinute} ${startHour} 1 */${interval || 1} *`,
            +reminderBeforeMinutes,
          );
        } else {
          cronExpression = this.adjustCronForReminder(
            `${startMinute} ${startHour} 1 * *`,
            +reminderBeforeMinutes,
          );
        }
        break;

      case 'yearly':
        if (interval) {

          cronExpression = this.adjustCronForReminder(
            `${startMinute} ${startHour} 1 1 */${interval || 1}`,
            +reminderBeforeMinutes,
          );
        } else {
          cronExpression = this.adjustCronForReminder(
            `${startMinute} ${startHour} 1 1 *`,
            +reminderBeforeMinutes,
          );
        }
        break;

      default:
        throw new Error('Invalid frequency');
    }

    return cronExpression;
  }


  private convertToMinutes(reminder: string, timeUnit: string): number {
    const reminderValue = parseInt(reminder, 10);


    switch (timeUnit) {
      case 'minutes':
        return reminderValue;
      case 'hours':
        return reminderValue * 60;
      case 'days':
        return reminderValue * 1440; // 1440 minutes in a day
      default:
        throw new Error('Invalid time unit');
    }
  }

  private adjustCronForReminder(
    cronExpression: string,
    reminderBeforeMinutes?: number,
  ): string {



    if (!reminderBeforeMinutes || reminderBeforeMinutes <= 0) {
      return cronExpression;
    }

    // Split the cron expression into its components
    const [minute, hour, dayOfMonth, month, dayOfWeek] = cronExpression.split(' ');



    // Convert the time into minutes
    const timeInMinutes = parseInt(hour) * 60 + parseInt(minute);

    const adjustedTimeInMinutes = timeInMinutes - reminderBeforeMinutes;


    // Calculate the new hour and minute
    let adjustedHour = Math.floor(adjustedTimeInMinutes / 60);
    const adjustedMinute = adjustedTimeInMinutes % 60;

    // Adjust hour if it goes below 0
    if (adjustedHour < 0) {
      adjustedHour += 24;
    }




    // Construct the new cron expression with the adjusted time


    return `${adjustedMinute} ${adjustedHour} ${dayOfMonth} ${month} ${dayOfWeek}`;
  }


  // Private function to generate cron expression for a specific date
  private generateCronExpressionForSpecificDate(date: string, notification: { timeUnit: string, reminder: string }): string {
    const targetDate = new Date(date);
    const { timeUnit, reminder } = notification;

    // Convert the reminder time to minutes
    const reminderBeforeMinutes = this.convertToMinutes(reminder, timeUnit);

    // Subtract the reminder time in minutes from the target date
    targetDate.setUTCMinutes(targetDate.getUTCMinutes() - reminderBeforeMinutes);

    const minute = targetDate.getUTCMinutes();
    const hour = targetDate.getUTCHours();
    const day = targetDate.getUTCDate();
    const month = targetDate.getUTCMonth() + 1; // Month in JavaScript Date is zero-indexed, so add 1

    // Generate cron expression for the specific date and time
    return `${minute} ${hour} ${day} ${month} *`;
  }

  private checkCronAvailability(name: string) {

    return this.schedulerRegistry.getCronJob(name)

  }
}

