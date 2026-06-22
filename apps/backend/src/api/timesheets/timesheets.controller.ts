import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Logger,
  UseGuards,
  Query,
} from '@nestjs/common';

import { TimeSheetsService } from './timesheets.service';

import { UserDetails } from '@lib/decorators';
import { TimeSheetDto } from '@lib/dto';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AccessGuard } from '@lib/guards';

import { TimeSheetCommentDto } from '@lib/dto/dtos/timesheet/timesheetComment.dto';
import { GetTimeQueryDto } from '@lib/dto/dtos/timesheet/getTimeSheet.dto';
import { GetMonthQueryDto } from '@lib/dto/dtos/timesheet/getMonthSheet.dto';

/*
|--------------------------------------------------------------------------
| TimeSheet Controller
|--------------------------------------------------------------------------
|
| Handles all TimeSheet-related API requests.
|
| Features:
| - Create Timesheet
| - Get Timesheets
| - Update Timesheet
| - Approve Timesheet
| - Reject Timesheet
| - View Work Statistics
|
| Controller -> Service -> Database
|
|--------------------------------------------------------------------------
*/

@ApiTags('TimeSheet') // Swagger API Group
@UseGuards(AccessGuard) // Require Authentication
@ApiBearerAuth() // JWT Authentication in Swagger
@Controller('timesheets') // Base Route: /timesheets
export class TimeSheetsController {
  private readonly logger = new Logger(TimeSheetsController.name);

  constructor(
    /*
    |--------------------------------------------------------------------------
    | Dependency Injection
    |--------------------------------------------------------------------------
    |
    | Inject TimeSheetsService
    | Contains all business logic.
    |
    |--------------------------------------------------------------------------
    */
    private readonly timeSheetsService: TimeSheetsService,
  ) { }

  /*
  |--------------------------------------------------------------------------
  | Create TimeSheet
  |--------------------------------------------------------------------------
  |
  | Endpoint:
  | POST /timesheets
  |
  | Creates a new timesheet entry for logged-in employee.
  |
  |--------------------------------------------------------------------------
  */
  @Post()
  createTimeSheet(
    @Body() timeSheetDto: TimeSheetDto,
    @UserDetails() user: any,
  ) {
    return this.timeSheetsService.createTimeSheetByEmployee(
      timeSheetDto,
      user,
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Get All TimeSheets
  |--------------------------------------------------------------------------
  |
  | Endpoint:
  | GET /timesheets
  |
  | Query Example:
  |
  | /timesheets?month=6&year=2026
  |
  |--------------------------------------------------------------------------
  */
  @Get()
  findAllTimeSheet(
    @UserDetails() user: any,
    @Query() query: GetTimeQueryDto,
  ) {
    return this.timeSheetsService.findAllTimeSheetOfUser(
      query,
      user,
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Get My TimeSheets
  |--------------------------------------------------------------------------
  |
  | Endpoint:
  | GET /timesheets/me
  |
  | Returns current user's monthly timesheets.
  |
  |--------------------------------------------------------------------------
  */
  @Get('me')
  findAllMyTimeSheet(
    @Query() query: GetMonthQueryDto,
    @UserDetails() user: any,
  ) {
    return this.timeSheetsService.findParticularUserTimeSheet(
      user,
      query,
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Update TimeSheet
  |--------------------------------------------------------------------------
  |
  | Endpoint:
  | PATCH /timesheets/:timeSheetId
  |
  | Updates an existing timesheet.
  |
  |--------------------------------------------------------------------------
  */
  @Patch(':timeSheetId')
  updateTimeSheet(
    @Param('timeSheetId') timeSheetId: string,
    @Body() timeSheetDto: TimeSheetDto,
    @UserDetails() user: any,
  ) {
    return this.timeSheetsService.updateParticularTimeSheet(
      timeSheetId,
      timeSheetDto,
      user,
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Approve TimeSheet
  |--------------------------------------------------------------------------
  |
  | Endpoint:
  | PATCH /timesheets/approved/:timeSheetId
  |
  | Usually performed by:
  | - Team Lead
  | - Manager
  | - Admin
  |
  |--------------------------------------------------------------------------
  */
  @Patch('approved/:timeSheetId')
  approvedTimeSheet(
    @Param('timeSheetId') timeSheetId: string,
    @UserDetails() user: any,
  ) {
    return this.timeSheetsService.approvedParticularTimeSheet(
      timeSheetId,
      user,
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Reject TimeSheet
  |--------------------------------------------------------------------------
  |
  | Endpoint:
  | PATCH /timesheets/rejected/:timeSheetId
  |
  | Requires rejection comment/message.
  |
  | Example:
  | {
  |   "message": "Incorrect work hours entered"
  | }
  |
  |--------------------------------------------------------------------------
  */
  @Patch('rejected/:timeSheetId')
  rejectedTimeSheet(
    @Param('timeSheetId') timeSheetId: string,
    @Body() comment: TimeSheetCommentDto,
    @UserDetails() user: any,
  ) {
    return this.timeSheetsService.rejectedParticularTimeSheet(
      timeSheetId,
      comment.message,
      user,
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Get My Work Statistics
  |--------------------------------------------------------------------------
  |
  | Endpoint:
  | GET /timesheets/static
  |
  | Example:
  | /timesheets/static?month=6&year=2026
  |
  | Returns:
  | - Total Working Days
  | - Approved Entries
  | - Rejected Entries
  | - Pending Entries
  |
  |--------------------------------------------------------------------------
  */
  @Get('static')
  totalStatus(
    @Query() query: GetMonthQueryDto,
    @UserDetails() user: any,
  ) {
    return this.timeSheetsService.workStatic(
      user,
      query,
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Get Specific User Statistics
  |--------------------------------------------------------------------------
  |
  | Endpoint:
  | GET /timesheets/static/:userId
  |
  | Example:
  | /timesheets/static/685bc4f12a
  |
  | Used by:
  | - Manager
  | - Admin
  | - Team Lead
  |
  |--------------------------------------------------------------------------
  */
  @Get('static/:userId')
  totalUserStatus(
    @Query() query: GetMonthQueryDto,
    @Param('userId') userId: string,
    @UserDetails() requester: any,
  ) {
    return this.timeSheetsService.singleUserWorkStats(
      userId,
      query,
      requester,
    );
  }
}