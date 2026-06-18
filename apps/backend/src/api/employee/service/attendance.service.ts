import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Attendance, Breaks, Calendar, CALENDAR_EVENT_TYPE, Employee } from '@lib/database';
import { ClientProxy } from '@nestjs/microservices';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';
import { readFileSync } from 'fs';
import * as moment from 'moment';
import {
  demoDelay,
  NOTIFICATION_SERVICE,
  NOTIFY_USERS_TOPIC,
} from '@lib/common';
import { AddAttendanceDto, AddBreaksDto, CloseBreaksDto } from '@lib/dto';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class AttendanceService {
  private logger = new Logger(AttendanceService.name);

  constructor(
    @InjectModel(Attendance.name)
    private readonly attendanceModel: Model<Attendance>,
    @InjectModel(Breaks.name) private readonly breaksModel: Model<Breaks>,
    @InjectModel(Employee.name) private readonly employeeModel: Model<Employee>,
    @InjectModel(Calendar.name) private readonly calendarModel: Model<Calendar>,
    @Inject(NOTIFICATION_SERVICE) private readonly emailClient: ClientProxy,
    private readonly eventEmmiter: EventEmitter2,
    private readonly configService: ConfigService,
  ) { }

  // v1 only for date
  // async findAttendance(employeeId: string) {
  //   const currentDate = new Date();
  //   const currentDateString = new Date(currentDate.toDateString());

  //   const d = await this.attendanceModel.find({
  //     createdAt: {
  //       $gte: currentDateString, // Greater than or equal to the current date (ignoring time)
  //       $lt: new Date(currentDateString.getTime() + 24 * 60 * 60 * 1000) // Less than the next day (current date + 1 day)
  //     },
  //     employeeId: employeeId
  //   }).populate("breaks").exec()
  //   return d;
  // }

  // v2 only without exittime
  // async findAttendance(employeeId: string) {
  //     const currentDate = new Date();
  //     const currentDateString = new Date(currentDate.toDateString());

  //     // Check for any record without exitTime for the given employeeId
  //     let attendance = await this.attendanceModel.findOne({
  //         employeeId: employeeId,
  //         exitTime: { $exists: false } // $exists: false will find documents where the field is missing
  //     }).populate("breaks").exec();

  //     return attendance ? [attendance] : [];
  // }

  // v3 if exitTime then current Date
  async findAttendance(employeeId: string) {
    const currentDate = new Date();
    const currentDateString = new Date(currentDate.toDateString());

    // Check for any record without exitTime for the given employeeId
    let attendance = await this.attendanceModel
      .findOne({
        employeeId: employeeId,
        exitTime: { $exists: false }, // $exists: false will find documents where the field is missing
      })
      .populate('breaks')
      .exec();

    // If no record without exitTime is found, fetch the attendance for the current date
    if (!attendance) {
      attendance = await this.attendanceModel
        .findOne({
          createdAt: {
            $gte: currentDateString, // Greater than or equal to the current date (ignoring time)
            $lt: new Date(currentDateString.getTime() + 24 * 60 * 60 * 1000), // Less than the next day (current date + 1 day)
          },
          employeeId: employeeId,
        })
        .populate('breaks')
        .exec();
    }

    return attendance ? [attendance] : [];
  }

  async getIncompletedBreak(bk: any) {
    const brk = bk?.find((d) => !d?.endTime);
    return brk;
  }

  async addAttendance(attendanceData: AddAttendanceDto) {
    const d = await this.findAttendance(attendanceData.employeeId);
    if (d.length === 0) {
      // const user = await this.userModel.findOne({username:})
      const attn = await this.attendanceModel.create({
        employeeId: attendanceData.employeeId,
        attendanceType: attendanceData?.attendanceType,
      });


      this.eventEmmiter.emit('notify:realtime', {
        message: `${attn?.employeeId} has been marked present`,
      });

      return attn;
    }
    throw new HttpException('Attendace Already Given', HttpStatus.BAD_REQUEST);
  }

  async closeAttendance(attendanceData: AddAttendanceDto) {
    if (attendanceData?.id) {
      const d = await this.attendanceModel.findById(attendanceData?.id);
      if (d?.employeeId !== attendanceData?.employeeId) {
        return { message: "Something isn't right !", success: false };
      }
      const opened_break = await this.getIncompletedBreak(d?.breaks);
      if (opened_break) {
        await this.breaksModel.findByIdAndUpdate(
          opened_break?._id,
          { endTime: new Date() },
          { new: true },
        );
      }
      const editedData = await this.attendanceModel
        .findByIdAndUpdate(
          attendanceData?.id,
          { exitTime: new Date() },
          { new: true },
        )
        .populate('breaks');
      return editedData;
    } else {
      const d = await this.findAttendance(attendanceData.employeeId);
      // console.log(d);
      // console.log(attendanceData)
      if (d.length === 0)
        throw new HttpException(
          'Attendance not opened',
          HttpStatus.BAD_REQUEST,
        );
      else if (d[0]?.exitTime)
        throw new HttpException(
          'Attendace already closed',
          HttpStatus.BAD_REQUEST,
        );

      const opened_break = await this.getIncompletedBreak(d[0]?.breaks);
      if (opened_break) {
        throw new HttpException(
          `Close your ${opened_break?.name} ${opened_break?.name.includes('break') ? '' : 'break'} first`,
          HttpStatus.BAD_REQUEST,
        );
      }
      const attendance = await this.attendanceModel
        .findByIdAndUpdate(d[0]?._id, { exitTime: new Date() }, { new: true })
        .populate('breaks');
      return attendance;
    }
  }

  // async listAttendence(employeeId: string, month: number, year: number) {

  //   return await this.attendanceModel.find().populate("breaks");
  // }

  // my monthsattendance
  async listAttendence(employeeId: string, month?: number, year?: number) {
    // If month or year are not provided, use current month/year
    // this.logger.log(month, year)
    const now = new Date();
    if (month === undefined) {
      month = now.getMonth();
    }

    if (year === undefined) {
      year = now.getFullYear();
    }

    // if (month < 0 || month > 12) {
    //   return { message: "Invalid months provided", success: false }
    // }

    const start = new Date(year, month, 1);
    // let endMonth = month === 11 ? 0 : month + 1;
    // let endYear = month === 11 ? year + 1 : year;
    // let end = new Date(endYear, endMonth, 1);
    const end = new Date(
      start.getMonth() === 11
        ? new Date(
          new Date(
            new Date(start).setFullYear(new Date(start).getFullYear() + 1),
          ).setMonth(0),
        )
        : new Date(start).setMonth(new Date(start).getMonth() + 1),
    );

    // this.logger.log(end, new Date())

    const latestAttendance = await this.attendanceModel
      .find({
        employeeId: employeeId,
        createdAt: {
          $gt: start,
          $lt: end,
        },
      })
      .sort({
        createdAt: -1,
      })
      .populate('breaks');

    return latestAttendance;
  }

  async fetchAttendanceChart(employeeId: string, days: number = 20) {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    const groupedData = await this.attendanceModel
      .aggregate([
        {
          $match: {
            employeeId: employeeId,
            createdAt: { $gte: fromDate },
          },
        },
        {
          $lookup: {
            from: 'breaks', // Replace with your actual breaks collection name
            localField: 'breaks',
            foreignField: '_id',
            as: 'breaks',
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            data: { $push: '$$ROOT' },
          },
        },
        {
          $project: {
            _id: 0,
            date: '$_id',
            data: 1,
          },
        },
      ])
      .exec();

    return groupedData.reduce(
      (acc, item) => {
        acc[item.date] = item.data[0];
        return acc;
      },
      {} as Record<string, Attendance>,
    );

    // return await this.attendanceModel.find({
    //   createdAt: { $gte: fromDate },
    // }).populate("breaks")
  }

  async fetchAttendanceChartForMonth(employeeId: string, month: string) {
    const [year, monthNumber] = month.split('-').map(Number);
    const startDate = new Date(year, monthNumber, 1);
    const endDate = new Date(year, monthNumber + 1, 1); // Last day of the month


    // await demoDelay(1000); // Simulate delay

    const groupedData = await this.attendanceModel
      .aggregate([
        {
          $match: {
            employeeId: employeeId,
            createdAt: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $lookup: {
            from: 'breaks', // Replace with your actual breaks collection name
            localField: 'breaks',
            foreignField: '_id',
            as: 'breaks',
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            data: { $push: '$$ROOT' },
          },
        },
        {
          $project: {
            _id: 0,
            date: '$_id',
            data: 1,
          },
        },
      ])
      .exec();

    return groupedData.reduce(
      (acc, item) => {
        acc[item.date] = item.data[0];
        return acc;
      },
      {} as Record<string, Attendance>,
    );
  }

  async listAllAttendence(date?: number, month?: number, year?: number) {
    // Use current date if date is not provided
    const now = new Date();

    if (date === undefined) {
      date = now.getDate();
    }
    if (month === undefined) {
      month = now.getMonth();
    }
    if (year === undefined) {
      year = now.getFullYear();
    }

    // Set the start to the beginning of the given day
    const start = new Date(year, month, date, 0, 0, 0, 0); // HH, MM, SS, MS are set to 0

    // Set the end to the end of the given day
    const end = new Date(year, month, date, 23, 59, 59, 999); // Just before the next day

    // Fetch records that have a createdAt date within the day
    const latestAttendance = await this.attendanceModel
      .find({
        createdAt: {
          $gte: start, // Use $gte for greater than or equal
          $lte: end, // Use $lte for less than or equal
        },
      })
      .populate('breaks');

    const employeeIds = [...new Set(latestAttendance.map((a) => a.employeeId))];
    const employees = await this.employeeModel.find({
      employeeId: { $in: employeeIds },
    });

    const mergedRecords = latestAttendance.map((attendance) => {
      const employee = employees.find(
        (e) => e.employeeId === attendance.employeeId,
      );
      return {
        ...attendance.toObject(),
        firstName: employee ? employee.firstName : null,
        lastName: employee ? employee.lastName : null,
      };
    });
    return mergedRecords;
  }

  // attendance details of users for hr and admin
  async userSpecificAttendanceDetails(
    employeeId: string,
    month: number,
    year: number,
  ) {
    const employeeDetails = await this.employeeModel.findOne({
      employeeId: employeeId,
    });

    if (!employeeDetails) {
      throw new HttpException('no employee found', HttpStatus.NOT_FOUND);
    }

    const tAttendance = await this.findAttendance(employeeId);
    const attn = tAttendance.length == 0 ? null : tAttendance[0];
    const monthsAttendance = await this.listAttendence(employeeId, month, year);
    const chartAttendance = await this.fetchAttendanceChartForMonth(
      employeeId,
      `${year}-${month}`,
    );

    return {
      todayAttendance: attn,
      monthsAttendance,
      chartAttendance,
    };
  }


  // monthly report
  async listMonthAttendences(month: number, year: number) {
    const start = new Date(year, month, 1);

    const end = new Date(
      start.getMonth() === 11
        ? new Date(
          new Date(
            new Date(start).setFullYear(new Date(start).getFullYear() + 1),
          ).setMonth(0),
        )
        : new Date(start).setMonth(new Date(start).getMonth() + 1),
    );

    // v1.1 stable
    let attendanceReportPipeline = [];

    attendanceReportPipeline.push({
      $match: {
        createdAt: {
          $gt: start,
          $lt: end,
        },
      },
    })

    attendanceReportPipeline.push({
      $lookup: {
        from: 'employees',
        localField: 'employeeId',
        foreignField: 'employeeId',
        as: 'employeeInfo',
      },
    })

    attendanceReportPipeline.push({
      $unwind: '$employeeInfo',
    })

    attendanceReportPipeline.push({
      $lookup: {
        from: 'designations',
        localField: 'employeeInfo.designation',
        foreignField: '_id',
        as: 'employeeInfo.designation',
      },
    })

    attendanceReportPipeline.push({
      $unwind: '$employeeInfo.designation',
    })

    attendanceReportPipeline.push({
      $lookup: {
        from: 'breaks',
        localField: 'breaks',
        foreignField: '_id',
        as: 'breaks',
      },
    })

    attendanceReportPipeline.push({
      $project: {
        employeeId: 1,
        createdAt: 1,
        breaks: 1,
        entryTime: 1,
        exitTime: 1,
        attendanceType: 1,
        firstName: '$employeeInfo.firstName',
        lastName: '$employeeInfo.lastName',
        dateJoined: '$employeeInfo.dateJoined',
        gender: '$employeeInfo.gender',
        image: '$employeeInfo.image',
        designationName: '$employeeInfo.designation.designationName',
        createdAtDate: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
        },
      },
    })

    attendanceReportPipeline.push({
      $group: {
        _id: '$employeeId',
        firstName: { $first: '$firstName' },
        lastName: { $first: '$lastName' },
        dateJoined: { $first: '$dateJoined' },
        gender: { $first: '$gender' },
        designationName: { $first: '$designationName' },
        attendances: {
          $push: {
            date: '$createdAtDate',
            attendanceData: {
              _id: '$_id',
              breaks: '$breaks',
              attendanceType: '$attendanceType',
              entryTime: '$entryTime',
              exitTime: '$exitTime',
              createdAt: '$createdAt',
            },
          },
        },
      },
    })

    attendanceReportPipeline.push({
      $addFields: {
        attendances: {
          $arrayToObject: {
            $map: {
              input: '$attendances',
              as: 'attendance',
              in: {
                k: '$$attendance.date',
                v: '$$attendance.attendanceData',
              },
            },
          },
        },
      },
    })


    attendanceReportPipeline.push({
      $sort: {
        _id: 1,
      },
    })


    const aggregatedAttendance = await this.attendanceModel.aggregate(attendanceReportPipeline);



    const rawHolidays = await this.calendarModel.aggregate([
      {
        $match: {
          $and: [
            {
              type: CALENDAR_EVENT_TYPE.HOLIDAY
            },
            {
              $or: [
                {
                  startDate: {
                    $gte: `${year}-${(month)?.toString().padStart(2, '0')}-01`,
                    $lt: `${year}-${(month + 2)?.toString().padStart(2, '0')}-01`,
                  }
                },
                {
                  endDate: {
                    $lt: `${year}-${(month + 2)?.toString().padStart(2, '0')}-10`,
                  }
                }
              ]
            }
          ]
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'attendees',
          foreignField: '_id',
          as: 'attendees',
        },
      },

      {
        $unwind: {
          path: '$attendees',
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $lookup: {
          from: 'employees',
          localField: 'attendees.userId',
          foreignField: '_id',
          as: 'attendees.userId',
        },
      },
      {
        $unwind: {
          path: '$attendees.userId',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          employeeId: "$attendees.userId.employeeId",
          date: {
            $function: {
              body: function (startDate: string, endDate: string) {
                const dates = [];
                const currentDate = new Date(startDate);
                while (currentDate <= new Date(endDate)) {
                  dates.push(new Date(currentDate).toISOString().split('T')[0]);
                  currentDate.setDate(currentDate.getDate() + 1);
                }
                return dates;
              },
              args: ["$startDate", "$endDate"],
              lang: "js"
            }
          },
        },
      },
      {
        $group: {
          _id: '$employeeId',
          dates: {
            $addToSet: "$date"
          }
        }
      },
      {
        $sort: {
          _id: 1
        }
      }
    ])

    let holidays = {};

    rawHolidays.forEach((holiday) => {
      holidays[holiday._id] = holiday.dates.flatMap((date: String) => date);
    })



    let report = [];
    aggregatedAttendance.forEach((att) => {
      if (holidays[att._id] === undefined) {
        this.logger.verbose(`No holidays for ${att._id}`);
        report.push({
          ...att,
          holidays: [],
          totalWorkingDays: 0
        })
      } else {
        report.push({
          ...att,
          holidays: holidays[att._id],
          totalWorkingDays: holidays[att._id].length,
        });
      }
    });

    return report;
  }

  async takeBreak(addBreaks: AddBreaksDto) {
    const d = await this.findAttendance(addBreaks.employeeId);

    if (d.length === 0) {
      throw new HttpException('Give Attendance First', HttpStatus.BAD_REQUEST);
    } else if (d[0]?.exitTime)
      throw new HttpException('Attendace Closed', HttpStatus.BAD_REQUEST);
    else if (d[0]?.breaks?.length === 0) {
      const brks = await this.breaksModel.create({ name: addBreaks.name });
      const curBreak = await this.attendanceModel
        .findByIdAndUpdate(
          d[0]?._id,
          { $push: { breaks: brks?._id } },
          { new: true },
        )
        .populate('breaks');
      return curBreak;
    }

    // this.logger.log(d)
    const opened_break = await this.getIncompletedBreak(d[0]?.breaks);
    if (opened_break) {
      throw new HttpException(
        `Close your ${opened_break?.name} ${opened_break?.name.includes('break') ? '' : 'break'} first!`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const brks = await this.breaksModel.create({ name: addBreaks.name });
    const nbrk = await this.attendanceModel
      .findByIdAndUpdate(
        d[0]?._id,
        { $push: { breaks: brks?._id } },
        { new: true },
      )
      .populate('breaks');
    return nbrk;
  }

  async closeBreak(closeBreak: CloseBreaksDto) {
    const d = await this.findAttendance(closeBreak.employeeId);

    if (d.length === 0) {
      throw new HttpException('Give Attendance First', HttpStatus.BAD_REQUEST);
    } else if (d[0]?.exitTime)
      throw new HttpException(
        'Attendance already closed',
        HttpStatus.BAD_REQUEST,
      );
    else if (d[0]?.breaks?.length === 0)
      throw new HttpException('No break opened', HttpStatus.BAD_REQUEST);

    const opened_break = await this.getIncompletedBreak(d[0]?.breaks);
    if (!opened_break) {
      throw new HttpException('No break opened', HttpStatus.BAD_REQUEST);
    }
    // this.logger.log(d)
    const brk = await this.breaksModel.findByIdAndUpdate(
      opened_break?._id,
      { endTime: new Date() },
      { new: true },
    );

    const nbrk = await this.findAttendance(closeBreak.employeeId);
    return nbrk[0];
  }

  async updateAttendanceTime(
    id: string,
    updatedData: { entryTime?: string; exitTime?: string },
    updatedBy: { id: string; name: string; email: string },
  ) {
    const attendance: any = await this.attendanceModel.findByIdAndUpdate(
      id,
      updatedData,
      { new: true },
    );
    const user = await this.employeeModel.findOne({
      employeeId: attendance?.employeeId,
    });

    const templateUrl = join(
      this.configService.get('TEMPLATE_LOCATION'),
      'attendance_time_update.html',
    );

    const template = readFileSync(templateUrl)
      .toString()
      .replaceAll('{{employee_name}}', `${user?.firstName} ${user?.lastName}`)
      .replaceAll(
        '{{header}}',
        `Update to Your Attendance Time on ${moment(attendance?.createdAt).format('Do MMMM, YYYY')}`,
      )
      .replaceAll('{{update_user_name}}', updatedBy.name);

    this.emailClient
      .send(
        { cmd: NOTIFY_USERS_TOPIC.SEND_EMAIL },
        {
          to: user?.email,
          cc: updatedBy?.email,
          replyTo: updatedBy?.email,
          subject: `Attendance Time Update - ${moment(attendance?.createdAt).format('Do MMMM, YYYY')}`,
          html: template,
        },
      )
      .toPromise();

    return attendance;
  }

  async updateBreakTime(
    id: string,
    updatedData: { createdAt?: string; endTime?: string },
    updatedBy: { id: string; name: string; email: string },
  ) {
    const breakData: any = await this.breaksModel.findByIdAndUpdate(id, {
      endTime: updatedData?.endTime,
    });
    const attendance: any = await this.attendanceModel.findOne({
      breaks: { $in: [breakData?._id] },
    });
    const user = await this.employeeModel.findOne({
      employeeId: attendance?.employeeId,
    });

    // console.log("PREV", breakData);
    // console.log("ATT", await this.breaksModel.findById(id));

    const templateUrl = join(
      this.configService.get('TEMPLATE_LOCATION'),
      'attendance_time_update.html',
    );

    const template = readFileSync(templateUrl)
      .toString()
      .replaceAll('{{employee_name}}', `${user?.firstName} ${user?.lastName}`)
      .replaceAll(
        '{{header}}',
        `Update to Your Attendance Time on ${moment(attendance?.createdAt).format('Do MMMM, YYYY')}`,
      )
      .replaceAll('{{update_user_name}}', updatedBy.name);

    this.emailClient
      .send(
        { cmd: NOTIFY_USERS_TOPIC.SEND_EMAIL },
        {
          to: user?.email,
          cc: updatedBy?.email,
          replyTo: updatedBy?.email,
          subject: `Attendance Time Update - ${moment(attendance?.createdAt).format('Do MMMM, YYYY')}`,
          html: template,
        },
      )
      .toPromise();

    return attendance;
  }

  async reopenAttendance(
    id: string,
    updatedBy: { id: string; name: string; email: string },
  ) {
    const attendance: any = await this.attendanceModel.findByIdAndUpdate(
      id,
      { $unset: { exitTime: '' } },
      { new: true },
    );
    const user = await this.employeeModel.findOne({
      employeeId: attendance?.employeeId,
    });

    const templateUrl = join(
      this.configService.get('TEMPLATE_LOCATION'),
      'attendance_time_update.html',
    );

    const template = readFileSync(templateUrl)
      .toString()
      .replaceAll('{{employee_name}}', `${user?.firstName} ${user?.lastName}`)
      .replaceAll(
        '{{header}}',
        `Reopening Your Attendance on ${moment(attendance?.createdAt).format('Do MMMM, YYYY')}`,
      )
      .replaceAll('{{update_user_name}}', updatedBy.name);

    this.emailClient
      .send(
        { cmd: NOTIFY_USERS_TOPIC.SEND_EMAIL },
        {
          to: user?.email,
          cc: updatedBy?.email,
          replyTo: updatedBy?.email,
          subject: `Attendance Reopening - ${moment(attendance?.createdAt).format('Do MMMM, YYYY')}`,
          html: template,
        },
      )
      .toPromise();

    return attendance;
  }
}
