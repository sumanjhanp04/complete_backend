import { RedisService } from '@app/cache/cache.service';
import { EmployeesService } from './../employee/service/employee.service';

import { TimeSheetDto } from './../../../../../libs/dto/src/dtos/timesheet/timesheet.dto';
import {
  Employee,
  EMPLOYEE_TYPE_MAP,
  STATUS,
  TimeSheet,
  TimeSheetComment,
  User,
  USER_TYPE_MAP,
} from '@lib/database';
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, now } from 'mongoose';
import * as moment from 'moment';
import { GetTimeQueryDto } from '@lib/dto/dtos/timesheet/getTimeSheet.dto';
import { AttendanceService } from '../employee/service/attendance.service';
import { GetMonthQueryDto } from '@lib/dto/dtos/timesheet/getMonthSheet.dto';
import { AUTH_SERVICE, EMPLOYEE_API_MAPS, getTotalBreakTimes, NOTIFICATION_STATUS, USERS_API_MAPS } from '@lib/common';
import { NotifyService } from '../../socket/notify/notify.service';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';

interface MonthMatchTypes {
  submitDate?: string;
  userId?: string;
}

@Injectable()
export class TimeSheetsService {
  private logger = new Logger(TimeSheetsService.name);
  constructor(
    @InjectModel(TimeSheet.name)
    private readonly timeSheetModel: Model<TimeSheet>,
    @InjectModel(Employee.name) public readonly employeeModel: Model<Employee>,
    @InjectModel(TimeSheetComment.name)
    private readonly timeSheetComment: Model<TimeSheetComment>,
    @InjectModel(User.name)
    private readonly userModel:Model<User>,
    private readonly employeeService: EmployeesService,
    private readonly attendanceService: AttendanceService,
    private readonly redisService: RedisService,
    private readonly notifyService: NotifyService,
    private readonly configService: ConfigService,
    @Inject(AUTH_SERVICE) private readonly authClient: ClientProxy,
  ) {}

  async createTimeSheetByEmployee(timeSheetDto: TimeSheetDto, user: any) {
    const isValidateDate = moment().isSameOrAfter(
      timeSheetDto.submitDate,
      'day',
    );

    if (!isValidateDate) {
      throw new BadRequestException();
    }

    await this.CheckTotalTimeDuration(user, timeSheetDto);

    const timeSheet = await this.timeSheetModel.create({
      ...timeSheetDto,
      userId: user.userId._id,
    });

    const splitDate = timeSheetDto.submitDate.split('-');

    const cacheKey = `T:${user.userId._id}:${+splitDate[1]}:${+splitDate[0]}`;
    const {
      totalWorkInAMonth,
      totalWorkDurationAsStatus,
      TotalTimeSheetDuration,
    } = await this.getTotalTimesForWorkStatic(
      user,
      +splitDate[1] - 1,
      +splitDate[0],
    );

    await this.redisService.setInCache(
      cacheKey,
      JSON.stringify({
        totalWorkInAMonth,
        totalWorkDurationAsStatus,
        TotalTimeSheetDuration,
      }),
      3000,
    );

    // this.logger.log(user)
    // 

    const userDetail = await this.userModel.findOne({
      userId:user.userId.reportsTo,
    })
    
    // this.logger.log({userDetail});
    
    const employeeDetails = await this.employeeModel.findOne({
      _id: user.userId._id,
    });

    if(user.userId.reportsTo !=null && user.userId.reportsTo !== undefined){
      const notificationData: any = {
        actor: user._id, // user id not Employee Id
        data: {
         //...timeSheet,
          ...timeSheet.toObject(),
          firstName: employeeDetails?.firstName || '',
          lastName: employeeDetails?.lastName || '',
          employeeId: employeeDetails?.employeeId || '',
        },
        redirectUrl:"/ems/timesheet?tab=all",
        notifier: userDetail._id, //  user id not Employee Id
        status: NOTIFICATION_STATUS.UNREAD,
      };
  
      await this.notifyService.notifyUserWithDb(notificationData);
      // this.logger.log({data})
    }


    return timeSheet;
  }

  async findAllTimeSheetOfUser(query?: GetTimeQueryDto, user?: any) {
    const now = new Date();
    const year = query.year || now.getFullYear();
    const month = query.month
      ? String(query.month + 1).padStart(2, '0')
      : String(now.getMonth() + 1).padStart(2, '0');

    // this.logger.log({query})
    // this.logger.log({ year, month });
    const searchParam: Record<string, any> = {};

    if (query.year && !query.month) {
      // Fetch by year only
      searchParam.submitDate = { $regex: `${year}-` };
    } else {
      // Fetch by year + month (or current month/year if not provided)
      searchParam.submitDate = { $regex: `${year}-${month}-` };
    }

    let sortParam: Record<string, any> = {};

    if (query?.sort && query?.sortBy) {
      sortParam = {
        [query.sortBy]: query.sort === 'asc' ? 1 : -1,
      };
    } else if (query?.sort) {
      sortParam = { createdAt: query.sort === 'asc' ? 1 : -1 };
    } else if (query.sortBy) {
      sortParam = {
        [query.sortBy]: 1,
      };
    }

    // if (query.page && query.limit) {
    const page: number = Number(query.page) || 1;
    const limit: number = Number(query.limit) || 50;
    const skip: number = (page - 1) * limit;

    // this.logger.log(data);
    const employeePipeLine = await this.buildAdvancePipeline(
      searchParam,
      user?.userId?.role,
      user?.userId?._id,
      skip,
      limit,
      sortParam,
    );
    const [data, totalDocuments] = await Promise.all([
      this.employeeModel.aggregate(employeePipeLine),
      this.employeeModel.countDocuments(),
    ]);

    return {
      data: data,
      pagination: {
        total: totalDocuments,
        count: data.length,
      },
    };
  }

  async findParticularUserTimeSheet(user: any, query: GetMonthQueryDto) {
    const year = query.year;
    const month = String(query.month + 1).padStart(2, '0');

    // this.logger.log({ query });
    // this.logger.log('inside the search params');

    const timeSheets = await this.timeSheetModel.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(user.userId._id),
          submitDate: {
            $regex: `${year}-${month}`,
          },
        },
      },
      {
        $lookup: {
          from: 'employees',
          localField: 'userId',
          foreignField: '_id',
          as: 'userId',
        },
      },
      {
        $unwind: {
          path: '$userId',
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $lookup: {
          from: 'timesheetcomments',
          localField: '_id',
          foreignField: 'timeSheet',
          as: 'comments',
        },
      },
      {
        $group: {
          _id: '$submitDate',
          totalDuration: {
            $sum: {
              $toInt: '$duration',
            },
          },
          items: { $push: '$$ROOT' },
        },
      },
      {
        $sort: {
          _id: -1,
        },
      },
      {
        $project: {
          submitDate: '$_id',
          totalDuration: 1,
          tasks: '$items',
        },
      },
    ]);
    return timeSheets;
  }

  async updateParticularTimeSheet(
    timeSheetId: string,
    timeSheetDto: TimeSheetDto,
    user: any,
  ) {
    const existingTimeSheet = await this.timeSheetModel.findById(timeSheetId);
    // this.logger.log(existingTimeSheet);
    if (!existingTimeSheet) {
      throw new BadRequestException('TimeSheet not found');
    }

    if (existingTimeSheet.status !== STATUS.REJECTED) {
      throw new BadRequestException('No access to edit');
    }
    await this.CheckTotalTimeDuration(
      user,
      timeSheetDto,
      existingTimeSheet,
      existingTimeSheet.duration,
    );

    existingTimeSheet.content = timeSheetDto.content;
    existingTimeSheet.submitDate = timeSheetDto.submitDate;
    existingTimeSheet.duration = timeSheetDto.duration.toString();
    existingTimeSheet.status = STATUS.PENDING;

    await existingTimeSheet.save();

    return existingTimeSheet;
  }

  async approvedParticularTimeSheet(timeSheetId: string, user: any) {
    const timeSheet = await this.timeSheetModel.findById(timeSheetId);
    if (!timeSheet) {
      throw new BadRequestException();
    }
    const employee = await this.employeeService.getEmployeeDetails(
      timeSheet?.userId,
    );

    if (
      employee?.data?.basicDetails?.reportsTo?._id == user.userId._id ||
      user.userId.role == 'Hr' ||
      user.userId.role == 'Admin'
    ) {
      const updatedTimeSheet = await this.timeSheetModel.findByIdAndUpdate(
        timeSheetId,
        {
          $set: {
            status: STATUS.APPROVED,
            approveBy: user.userId._id,
            approveAt: now(),
          },
        },
        { new: true },
      );

      return updatedTimeSheet;
    } else {
      throw new BadRequestException();
    }
  }

  async rejectedParticularTimeSheet(
    timeSheetId: string,
    comment: string,
    user: any,
  ) {
    const existingTimeSheet = await this.timeSheetModel.findOne({
      _id: timeSheetId,
      status: STATUS.PENDING,
    });

    if (!existingTimeSheet) {
      throw new NotFoundException(
        'Either timesheet is status updated or Timesheet is not found',
      );
    }

    const existingTimeSheetComment = await this.timeSheetComment.findOne({
      timeSheet: existingTimeSheet._id,
    });

    const employee = await this.employeeService.getEmployeeDetails(
      existingTimeSheet?.userId,
    );

    if (
      employee?.data?.basicDetails?.reportsTo?._id != user.userId._id &&
      user.userId.role != 'Hr' &&
      user.userId.role != 'Admin'
    ) {
      throw new BadRequestException();
    }

    if (!existingTimeSheetComment) {
      const createNewTimeSheetComment = await this.timeSheetComment.create({
        timeSheet: timeSheetId,
        commentContent: [
          {
            userId: user.userId._id,
            comment,
          },
        ],
      });

      existingTimeSheet.status = STATUS.REJECTED;
      await existingTimeSheet.save();

      return createNewTimeSheetComment;
    }
    const updatedTimeSheetComment =
      await this.timeSheetComment.findByIdAndUpdate(
        existingTimeSheetComment._id,
        {
          $push: {
            commentContent: {
              userId: user.userId._id,
              comment,
            },
          },
        },
        { new: true },
      );

    existingTimeSheet.status = STATUS.REJECTED;
    await existingTimeSheet.save();

    return updatedTimeSheetComment;
  }

  async singleUserWorkStats(
    userId: string,
    query: GetMonthQueryDto,
    requester: any
  ){
    const user = await this.authClient.send(
      { cmd: EMPLOYEE_API_MAPS.EMPLOYEE_DETAILS },
      userId 
    ).toPromise();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const reportsTo = user.data.basicDetails?.reportsTo?._id;
    const isManager = reportsTo === requester.userId._id;
    const isAdminOrHr = ['Admin', 'Hr'].includes(requester.userId.role);

    if (!isManager && !isAdminOrHr) {
      throw new ForbiddenException('You are not authorized to access this user’s timesheet');
    }
    return this.workStatic({userId:user.data.basicDetails}, query);
  }

  async workStatic(user: any, query: GetMonthQueryDto) {
    const year = Number(query.year);
    const month = Number(query.month);
    // this.logger.log('inside the work static');
    this.logger.log({ user });

    // const monthInString = String(query.month + 1).padStart(2, '0');

    const cacheKey = `T:${user.userId._id}:${month + 1}:${year}`;

    this.logger.log({ cacheKey });

    const cacheData = await this.redisService.getFromCache(cacheKey);

    if (typeof cacheData == 'string' && cacheData) {
      this.logger.log('fetch from cache');
      // this.logger.log(cacheData);
      return JSON.parse(cacheData);
    }

    const {
      totalWorkInAMonth,
      totalWorkDurationAsStatus,
      TotalTimeSheetDuration,
    } = await this.getTotalTimesForWorkStatic(user, month, year);

    await this.redisService.setInCache(
      cacheKey,
      JSON.stringify({
        totalWorkInAMonth,
        totalWorkDurationAsStatus,
        TotalTimeSheetDuration,
      }),
      3000,
    );

    return {
      totalWorkInAMonth,
      totalWorkDurationAsStatus,
      TotalTimeSheetDuration,
    };
  }

  private async CheckTotalTimeDuration(
    user: any,
    timeSheetDto: TimeSheetDto,
    existingTimeSheet?: any,
    existingTimeSheetTimeDuration: string = '0',
  ) {
    const existingTimeSheetDataDetail = await this.timeSheetModel.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(user.userId._id),
          submitDate: timeSheetDto.submitDate,
        },
      },
      {
        $group: {
          _id: '$submitDate',
          totalDuration: {
            $sum: {
              $toInt: '$duration',
            },
          },
        },
      },
      {
        $unwind: {
          path: '$totalDuration',
          preserveNullAndEmptyArrays: true, // Keep docs with empty arrays
        },
      },
    ]);

    const dateFormate = timeSheetDto.submitDate.split('-');

    const attendanceData = await this.attendanceService.listAttendence(
      user.userId.employeeId,
      +dateFormate[1] - 1,
      +dateFormate[0],
    );

    const attendanceForParticularDay = attendanceData.find((item: any) => {
      if (moment(item.createdAt).isSame(timeSheetDto.submitDate, 'day')) {
        return item;
      }
    });
    if (!attendanceForParticularDay) {
      throw new BadRequestException('your are not working this date');
    }

    const { totalDurationInSeconds } = getTotalBreakTimes(
      attendanceForParticularDay.breaks,
    );
    const totalBreakTimeInSecond: number = Math.floor(
      totalDurationInSeconds / 60,
    );

    const start = moment(attendanceForParticularDay.entryTime);
    const end = attendanceForParticularDay.exitTime
      ? moment(attendanceForParticularDay.exitTime)
      : moment();
    const duration = moment.duration(end.diff(start));

    const totalWorkDuration = Math.floor(duration.asMinutes());

    const totalWorkingInMinutes = Math.abs(
      existingTimeSheetDataDetail[0]?.totalDuration +
        timeSheetDto.duration -
        Number(existingTimeSheetTimeDuration) -
        totalBreakTimeInSecond,
    );

    // todo: calc based on duration of attendance
    if (totalWorkingInMinutes > Math.floor(totalWorkDuration)) {
      throw new BadRequestException('you are exceeding the time limit');
    }
    return true;
  }

  private async buildAdvancePipeline(
    searchParam: Record<string, any>,
    role: string,
    employeeId: string,
    skip: number,
    limit: number,
    sort: Record<string, any>,
  ) {
    const roleSpecificStage = [];
    if (
      role != EMPLOYEE_TYPE_MAP.ADMIN &&
      role != EMPLOYEE_TYPE_MAP.HR &&
      role !== USER_TYPE_MAP.CLIENT
    ) {
      roleSpecificStage.push({
        $match: {
          reportsTo: new mongoose.Types.ObjectId(employeeId), // Both checks for safety
        },
      });
    }

    roleSpecificStage.push(
      {
        $lookup: {
          from: 'timesheets',
          localField: '_id',
          foreignField: 'userId',
          as: 'tasks',
          pipeline: [
            {
              $match: {
                ...searchParam,
              },
            },
            {
              $lookup: {
                from: 'timesheetcomments',
                localField: '_id',
                foreignField: 'timeSheet',
                as: 'comments',
              },
            },
          ],
        },
      },
      {
        $sort: {
          ...sort,
        },
      },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
    );

    return roleSpecificStage;
  }

  private totalWorkInADay(particularDayAttendance: any) {
    const { totalDurationInSeconds } = getTotalBreakTimes(
      particularDayAttendance?.breaks,
    );
    const totalBreakInMinutes: number = Math.floor(totalDurationInSeconds / 60);

    const start = moment(particularDayAttendance.entryTime);
    const end = particularDayAttendance?.exitTime
      ? moment(particularDayAttendance?.exitTime)
      : moment();
    const duration = moment.duration(end.diff(start));

    const totalWork = Math.floor(duration.asMinutes() - totalBreakInMinutes);

    return totalWork;
  }

  private async getTotalTimesForWorkStatic(
    user: any,
    month: number,
    year: number,
  ) {
    const monthInString = String(month + 1).padStart(2, '0');
    const myAttendanceForMonths = await this.attendanceService.listAttendence(
      user.userId.employeeId,
      month,
      year,
    );

    const totalWorkInAMonth = myAttendanceForMonths.reduce((acc, currVal) => {
      acc = acc + this.totalWorkInADay(currVal);
      return acc;
    }, 0);

    const commonCondition = {
      $match: {
        userId: new mongoose.Types.ObjectId(user.userId._id),
        submitDate: {
          $regex: `${year}-${monthInString}-`,
        },
      },
    };

    const [totalWorkDurationAsStatus, TotalTimeSheetDuration] =
      await Promise.all([
        // find the total Time sheet durration based on status
        await this.timeSheetModel.aggregate([
          {
            ...commonCondition,
          },
          {
            $group: {
              _id: '$status',
              totalWorkAsStatus: { $sum: { $toInt: '$duration' } },
            },
          },
        ]),
        // get total timeSheet calculate time,
        await this.timeSheetModel.aggregate([
          {
            ...commonCondition,
          },
          {
            $group: {
              _id: null,
              totalWork: { $sum: { $toInt: '$duration' } },
            },
          },
        ]),
      ]);

    return {
      totalWorkInAMonth,
      totalWorkDurationAsStatus,
      TotalTimeSheetDuration,
    };
  }
}
