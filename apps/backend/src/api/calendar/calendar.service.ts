import {
  CALENDER_USER_TYPE,
  CONVERSATION_SERVICE,
  NOTIFY_USERS_TOPIC,
  SCHEDULER_SERVICE,
  ToastStatus,
} from '@lib/common';
import { SCHEDULER_MAPS } from '@lib/common/topics/maps/scheduler.maps';
import {
  Calendar,
  CALENDAR_EVENT_TYPE,
  EMPLOYEE_TYPE_MAP,
  User,
  USER_TYPE_MAP,
  USER_TYPES,
} from '@lib/database';
import { CreateCalendarDto, UpdateCalendarDto } from '@lib/dto';
import { Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/mongoose';
import { RedisService } from 'libs/cache/src';

import { Model } from 'mongoose';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);
  constructor(
    @InjectModel(Calendar.name) private readonly calenderModel: Model<Calendar>,
    @Inject(SCHEDULER_SERVICE) private readonly schedulerClient: ClientProxy,
    @Inject(CONVERSATION_SERVICE)
    private readonly notificationClient: ClientProxy,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly redisService: RedisService,
  ) { }
  async create(
    createCalendarDto: CreateCalendarDto,
    userId: string,
    role: string,
  ) {
    //Check if not admin or hr and try to access holiday or oh
    if (
      (createCalendarDto?.type === CALENDAR_EVENT_TYPE.HOLIDAY ||
        createCalendarDto?.type === CALENDAR_EVENT_TYPE.OPTIONAL_HOLIDAY) &&
      ![EMPLOYEE_TYPE_MAP.ADMIN, EMPLOYEE_TYPE_MAP.HR].includes(role)
    ) {
      throw new UnauthorizedException('Access Denied');
    }

    const { userType } = createCalendarDto;

    //userType is all Employee
    if (userType === CALENDER_USER_TYPE.EMPLOYEES) {
      const userIds = await this.userModel
        .find({ userType: USER_TYPE_MAP.EMPLOYEE })
        .select('_id')
        .lean();
      const idArray = userIds.map((user) => user._id?.toString());
      createCalendarDto.attendees = idArray;
    } else if (userType === CALENDER_USER_TYPE.SHIFT) {
      const userIds = await this.userModel.find({
        shift: createCalendarDto.shift,
      });
      const idArray = userIds.map((user) => user._id?.toString());
      createCalendarDto.attendees = idArray;
    }
    //userType is all Clients
    else if (userType === CALENDER_USER_TYPE.CLIENTS) {
      const userIds = await this.userModel
        .find({ userType: USER_TYPE_MAP.CLIENT })
        .select('_id')
        .lean();
      const idArray = userIds.map((user) => user._id?.toString());
      createCalendarDto.attendees = idArray;
    }

    const calendarData = await this.calenderModel.create({
      ...createCalendarDto,
      owner: userId,
    });

    //Schedule event
    if (
      createCalendarDto?.isRecurring ||
      createCalendarDto?.type === CALENDAR_EVENT_TYPE.HOLIDAY ||
      createCalendarDto?.type === CALENDAR_EVENT_TYPE.OPTIONAL_HOLIDAY
    ) {
      const res = this.schedulerClient.send(
        { cmd: SCHEDULER_MAPS.RECURRING_EVENT },
        {
          id: calendarData?._id,
          daysOfWeek: calendarData?.daysOfWeek,
          specificDate: calendarData?.startDate,
          type: calendarData?.type,
          frequency: calendarData?.frequency ?? null,
          startTime: calendarData?.startTime ?? null,
          interval: calendarData?.interval ?? null,
          meetingLink: calendarData?.meetingLink ?? null,
          expiryDate: calendarData?.expiryDate ?? null,
          count: calendarData?.count ?? null,
          notifications: calendarData?.notifications ?? null,
          attendees: calendarData?.attendees ?? [],
        },
      );
      lastValueFrom(res);
    }

    return calendarData;
  }

  async findAll(
    userId: string,
    query: { day: string; month: string; year: string; type: string },
  ) {
    try {
      // Generate a unique cache key using userId and query parameters
      const cacheKey = `findAll:${userId}:${JSON.stringify(query)}`;

      // // Check if data exists in cache
      const cachedData = await this.redisService.getFromCache(cacheKey);
      if (typeof cachedData === 'string' && cachedData) {
        this.logger.debug('Calendar Fetched from cache');
        return JSON.parse(cachedData);
      }

      const filter: any = {
        $or: [
          { owner: userId },
          {
            type: {
              $in: [
                CALENDAR_EVENT_TYPE.HOLIDAY,
                CALENDAR_EVENT_TYPE.OPTIONAL_HOLIDAY,
              ],
            },
          },
          {
            attendees: { $in: userId },
          },
        ],
      };

      if (query.day) {
        const [year, month, day] = query.day.split('-').map(Number);
        const start = new Date(year, month - 1, day);
        const end = new Date(year, month - 1, day + 2);
        filter.date = {
          $gte: start.toISOString().split('T')[0],
          $lt: end.toISOString().split('T')[0],
        };
      }

      if (query.month && query.year) {
        const { year, month } = query;

        const start = new Date(+year, +month - 1, 1);
        const end = new Date(+year, +month, 1);
        const startOfDayStr = start.toISOString().split('T')[0];
        const endOfDayStr = end.toISOString().split('T')[0];

        filter.$or = [
          { startDate: { $gte: startOfDayStr, $lt: endOfDayStr } },
          { isRecurring: true },
        ];
      }

      if (query?.type) {
        filter.type = query?.type?.trim()?.toUpperCase();
      }

      // Query the database
      const calendarData = await this.calenderModel
        .find(filter)
        .populate({
          path: 'attendees',
          populate: [
            {
              path: 'userId',
            },
          ],
        })
        .exec();

      const result = { calendarData, year: query.year, month: query.month };

      // Cache the result with an expiration time (e.g., 30 sec)
      await this.redisService.setInCache(
        cacheKey,
        JSON.stringify(result),
        30,
      );
      return result;
    } catch (error) {
      console.error('Error in findAll:', error);
      throw error;
    }
  }

  async findOne(id: string, userId: string) {
    const calendar = await this.calenderModel.findOne({
      _id: id,
      owner: userId,
    });

    return calendar;
  }

  async update(
    id: string,
    updateCalendarDto: UpdateCalendarDto,
    userId: string,
    role: string,
  ) {
    if (
      (updateCalendarDto?.type === CALENDAR_EVENT_TYPE.HOLIDAY ||
        updateCalendarDto?.type === CALENDAR_EVENT_TYPE.OPTIONAL_HOLIDAY) &&
      ![EMPLOYEE_TYPE_MAP.ADMIN, EMPLOYEE_TYPE_MAP.HR].includes(role)
    ) {
      throw new UnauthorizedException('Access Denied');
    }

    const itsOwnCalendar = await this.calenderModel.findOne({
      _id: id,
      owner: userId,
    });

    if (!itsOwnCalendar) throw new UnauthorizedException('Access Denied');

    const updatedCalendarData = await this.calenderModel.findByIdAndUpdate(
      id,
      updateCalendarDto,
      { new: true },
    );

    const isRecurringEvent =      
      updateCalendarDto?.isRecurring && updatedCalendarData?.isRecurring;

    const isHolidayEvent =
      updateCalendarDto?.type === CALENDAR_EVENT_TYPE.HOLIDAY &&
      updatedCalendarData?.type === CALENDAR_EVENT_TYPE.HOLIDAY;

    const isOptionalHolidayWithNotification =
      updateCalendarDto?.type === CALENDAR_EVENT_TYPE.OPTIONAL_HOLIDAY &&
      updatedCalendarData?.type === CALENDAR_EVENT_TYPE.OPTIONAL_HOLIDAY &&
      updatedCalendarData?.notifications?.length > 0;

    const hasMatchingRecurrence =
      updateCalendarDto.daysOfWeek === updatedCalendarData?.daysOfWeek ||
      updateCalendarDto?.frequency === updatedCalendarData?.frequency ||
      updateCalendarDto?.interval === updatedCalendarData?.interval;

    if (
      isRecurringEvent ||
      isHolidayEvent ||
      (isOptionalHolidayWithNotification && hasMatchingRecurrence)
    ) {
      //first delete the cron job
      const deleteCronRes = this.schedulerClient.send(
        { cmd: SCHEDULER_MAPS.DELETE_EVENT },
        {
          name: updatedCalendarData?._id,
        },
      );
      await lastValueFrom(deleteCronRes);

      //then execute the updated cron job
      const res = this.schedulerClient.send(
        { cmd: SCHEDULER_MAPS.RECURRING_EVENT },
        {
          id: updatedCalendarData?._id,
          daysOfWeek: updatedCalendarData?.daysOfWeek,
          specificDate: updatedCalendarData?.startDate,
          type: updatedCalendarData?.type,
          frequency: updatedCalendarData?.frequency ?? null,
          startTime: updatedCalendarData?.startTime ?? null,
          interval: updatedCalendarData?.interval ?? null,
          meetingLink: updatedCalendarData?.meetingLink ?? null,
          expiryDate: updatedCalendarData?.expiryDate ?? null,
          count: updatedCalendarData?.count ?? null,
          notifications: updatedCalendarData?.notifications ?? null,
          attendees: updatedCalendarData?.attendees ?? [],
        },
      );
      lastValueFrom(res);
    }

    return updatedCalendarData;
  }

  async remove(id: string, userId: string) {
    const itsOwnCalendar = await this.calenderModel.findOne({
      _id: id,
      owner: userId,
    });

    if (!itsOwnCalendar) throw new UnauthorizedException('Access Denied');

    const calendarData = await this.calenderModel.findByIdAndDelete(id, {
      new: true,
    });

    //Removing the schedule event
    if (calendarData?.isRecurring) {
      const res = this.schedulerClient.send(
        { cmd: SCHEDULER_MAPS.DELETE_EVENT },
        {
          name: calendarData?._id,
        },
      );
      lastValueFrom(res);
    }
    return calendarData;
  }
}

/**Condition for calendar update */

// (updateCalendarDto?.isRecurring && updatedCalendarData?.isRecurring) ||
// (updateCalendarDto?.type === CALENDAR_EVENT_TYPE.HOLIDAY &&
//   updatedCalendarData?.type === CALENDAR_EVENT_TYPE.HOLIDAY) ||
// (updateCalendarDto?.type === CALENDAR_EVENT_TYPE.OPTIONAL_HOLIDAY &&
//   updatedCalendarData?.type === CALENDAR_EVENT_TYPE.OPTIONAL_HOLIDAY &&
//   updatedCalendarData?.notifications?.length > 0 &&
//   (updateCalendarDto.daysOfWeek === updatedCalendarData?.daysOfWeek ||
//     updateCalendarDto?.frequency === updatedCalendarData?.frequency ||
//     updateCalendarDto?.interval === updatedCalendarData?.interval))
