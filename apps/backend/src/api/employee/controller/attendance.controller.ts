import { AccessGuard, IpsecGuard } from '@lib/guards';
import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AttendanceService } from '../service/attendance.service';
import { HasAccess, UserDetails } from '@lib/decorators';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';

@ApiTags('AttendanceApi')
@Controller('attendance')
@UseGuards(AccessGuard)
@ApiBearerAuth()
export class AttendanceController {
  private logger = new Logger(AttendanceController.name);
  constructor(private readonly attendanceService: AttendanceService) { }

  @Post()
  @UseGuards(IpsecGuard)
  async createAttendance(@UserDetails() user: any) {
    const employeeId = user?.userId?.employeeId;

    const rdata = await this.attendanceService.addAttendance({
      employeeId,
      attendanceType: user?.workfromhome ? 'WFH' : 'WFO',
    });
    return rdata;
  }

  @Put()
  @UseGuards(IpsecGuard)
  async closeAttendance(@UserDetails() user: any) {
    const employeeId = user?.userId?.employeeId;
    const rdata = await this.attendanceService.closeAttendance({ employeeId });
    return rdata;
  }

  @Get()
  @HasAccess()
  async listAllAttendance(
    @Query('date') date: number,
    @Query('month') month: number,
    @Query('year') year: number,
  ) {
    this.logger.log('ALL');
    const d = await this.attendanceService.listAllAttendence(date, month, year);
    return d;
  }

  @Get('today/me')
  async myTodaysAttendance(@UserDetails() user: any) {
    const data = await this.attendanceService.findAttendance(
      user.userId?.employeeId,
    );

    if (data?.length == 1) return data[0];
    return null;
  }

  @Get('chart')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        days: { type: 'number' },
      },
    },
  })
  async myAttendanceChart(
    @Query('days') days: number,
    @UserDetails() user: any,
  ) {
    const data = await this.attendanceService.fetchAttendanceChart(
      user.userId?.employeeId,
      days,
    );
    return data;
  }

  @Get('me')
  async listMyAttendance(
    @Query('month') month: number,
    @Query('year') year: number,
    @UserDetails() user: any,
  ) {
    const employeeId = user?.userId?.employeeId;
    this.logger.log(employeeId, month, year);
    const rdata = await this.attendanceService.listAttendence(
      employeeId,
      month,
      year,
    );
    return rdata;
  }

  @Get('report/single')
  @HasAccess()
  async singleAttendanceReport(
    @Query('month') month: number,
    @Query('year') year: number,
    @Query('employeeId') employeeId: string,
  ) {
    return await this.attendanceService.userSpecificAttendanceDetails(
      employeeId,
      month,
      year,
    );
  }

  @Get('report')
  @HasAccess()
  async listMnothsAttendance(
    @Query('month') month: number,
    @Query('year') year: number,
  ) {
    const rdata = await this.attendanceService.listMonthAttendences(
      month,
      year,
    );
    return rdata;
  }

  @Post('break')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
      },
    },
  })
  @UseGuards(IpsecGuard)
  async addBreak(@Body('name') name: string, @UserDetails() user: any) {
    const employeeId = user?.userId?.employeeId;
    const brk = await this.attendanceService.takeBreak({ name, employeeId });
    return brk;
  }

  @Put('break')
  @UseGuards(IpsecGuard)
  async closeBreak(@UserDetails() user: any) {
    const employeeId = user?.userId?.employeeId;
    const brk = await this.attendanceService.closeBreak({ employeeId });
    return brk;
  }

  // forcefully closing previous attendance
  @Put(':id/:empId')
  async closePreviousAttendance(
    @Param('id') id: string,
    @Param('empId') employeeId: string,
  ) {
    const rdata = await this.attendanceService.closeAttendance({
      id,
      employeeId,
    });
    return rdata;
  }

  @Patch(':id')
  @HasAccess()
  async updateAttendance(
    @Param('id') id: string,
    @Body() body: { entryTime?: string; exitTime?: string },
    @UserDetails() userDetail: any,
  ) {
    // this.logger.log("Updating Attendance : ")
    const data = await this.attendanceService.updateAttendanceTime(id, body, {
      id: userDetail?._id,
      name: `${userDetail?.userId?.firstName} ${userDetail?.userId?.lastName}`,
      email: userDetail?.userId?.email,
    });
    return data;
  }

  @Delete(':id')
  @HasAccess()
  async reopenAttendance(
    @Param('id') id: string,
    @UserDetails() userDetail: any,
  ) {
    this.logger.log('Re opening attendance : ');
    const data = await this.attendanceService.reopenAttendance(id, {
      id: userDetail?._id,
      name: `${userDetail?.userId?.firstName} ${userDetail?.userId?.lastName}`,
      email: userDetail?.userId?.email,
    });
    return data;
  }

  @Patch('break/:id')
  @HasAccess()
  async updateBreak(
    @Param('id') id: string,
    @Body() body: { createdAt?: string; endTime?: string },
    @UserDetails() userDetail: any,
  ) {
    this.logger.log('Updating Break : ', body);
    const data = await this.attendanceService.updateBreakTime(id, body, {
      id: userDetail?._id,
      name: `${userDetail?.userId?.firstName} ${userDetail?.userId?.lastName}`,
      email: userDetail?.userId?.email,
    });
    return data;
  }
}
