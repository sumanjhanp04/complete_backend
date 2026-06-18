import { Controller, Get, Post, Body, Patch, Param, Logger, UseGuards, Query } from '@nestjs/common';
import { TimeSheetsService } from './timesheets.service';
// import { EMPLOYEE_TYPE_MAP, EMPLOYEE_TYPES, TimeSheet, User } from '@lib/database';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model } from 'mongoose';
import {  UserDetails } from '@lib/decorators';
import {  TimeSheetDto } from '@lib/dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AccessGuard } from '@lib/guards';
import { TimeSheetCommentDto } from '@lib/dto/dtos/timesheet/timesheetComment.dto';
import { GetTimeQueryDto } from '@lib/dto/dtos/timesheet/getTimeSheet.dto';
import { GetMonthQueryDto } from '@lib/dto/dtos/timesheet/getMonthSheet.dto';


@ApiTags('TimeSheet')
@UseGuards(AccessGuard)
@Controller('timesheets')
@ApiBearerAuth()
export class TimeSheetsController {
  private readonly logger = new Logger(TimeSheetsController.name);
  constructor(
    private readonly timeSheetsService: TimeSheetsService, 
  ) {}

  @Post()
  createTimeSheet(
    @Body() timeSheetDto:TimeSheetDto,
    @UserDetails() user: any) {
    
    return this.timeSheetsService.createTimeSheetByEmployee(timeSheetDto, user);
  }

  @Get()
  findAllTimeSheet(@UserDetails() user: any, 
  @Query() query: GetTimeQueryDto) {
    return this.timeSheetsService.findAllTimeSheetOfUser(query,user);
  }

  @Get('me')
  findAllMyTimeSheet(
    @Query() query:GetMonthQueryDto,
    @UserDetails() user:any){
      return this.timeSheetsService.findParticularUserTimeSheet(user, query);
  }


  @Patch(':timeSheetId')
  updateTimeSheet(@Param('timeSheetId') timeSheetId: string,
  @Body() timeSheetDto:TimeSheetDto,
  @UserDetails() user: any) {
    return this.timeSheetsService.updateParticularTimeSheet(timeSheetId, timeSheetDto, user);
  }


  @Patch("approved/:timeSheetId")
  approvedTimeSheet(@Param('timeSheetId') timeSheetId: string,
  @UserDetails() user: any
 ){
    return this.timeSheetsService.approvedParticularTimeSheet(timeSheetId,user);
  }

  @Patch('rejected/:timeSheetId')
  rejectedTimeSheet(
    @Param('timeSheetId') timeSheetId: string,
    @Body() comment:TimeSheetCommentDto,
    @UserDetails() user: any
  ){
    
    return this.timeSheetsService.rejectedParticularTimeSheet(timeSheetId,comment.message, user)
  }
  
  @Get("static")
  totalStatus(
    @Query() query:GetMonthQueryDto,
    @UserDetails() user:any
  ){
    return this.timeSheetsService.workStatic(user, query)
  }

  @Get("static/:userId")
  totalUserStatus(
    @Query() query:GetMonthQueryDto,
    @Param('userId') userId: string,
    @UserDetails() requester: any
  ){
    return this.timeSheetsService.singleUserWorkStats(userId, query,requester)
  }
}
