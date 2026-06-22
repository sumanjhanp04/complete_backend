import { Module } from '@nestjs/common';

import { TimeSheetsService } from './timesheets.service';
import { TimeSheetsController } from './timesheets.controller';

import { DatabaseModule } from '@lib/database';

import { EmployeesService } from '../employee/service/employee.service';
import { EmployeeModule } from '../employee/employee.module';

import { RmqModule } from '@lib/rmq';
import { AUTH_SERVICE, NOTIFICATION_SERVICE } from '@lib/common';

import { RedisCacheModule } from '@app/cache/cache.module';
import { FileUploadModule } from '@app/file-upload';

import { UserModule } from '../user/user.module';

import { AttendanceService } from '../employee/service/attendance.service';

import { NotifyModule } from '../../socket/notify/notify.module';

/*
|--------------------------------------------------------------------------
| TimeSheets Module
|--------------------------------------------------------------------------
|
| This module manages all Timesheet-related functionality.
|
| Responsibilities:
| - Create Timesheets
| - Update Timesheets
| - Approve/Reject Timesheets
| - Generate Work Statistics
| - Employee Validation
| - Attendance Integration
| - Notifications
| - Authentication
|
|--------------------------------------------------------------------------
*/

@Module({
  /*
  |--------------------------------------------------------------------------
  | Imported Modules
  |--------------------------------------------------------------------------
  |
  | Modules required by TimeSheetsModule.
  |
  |--------------------------------------------------------------------------
  */
  imports: [
    /*
    |--------------------------------------------------------------------------
    | Database Module
    |--------------------------------------------------------------------------
    |
    | Provides MongoDB/Mongoose models.
    |
    |--------------------------------------------------------------------------
    */
    DatabaseModule,

    /*
    |--------------------------------------------------------------------------
    | RabbitMQ - Auth Service
    |--------------------------------------------------------------------------
    |
    | Used to communicate with Auth Microservice.
    |
    | Examples:
    | - Get User Details
    | - Verify User
    | - Authentication Related Operations
    |
    |--------------------------------------------------------------------------
    */
    RmqModule.register({
      name: AUTH_SERVICE,
    }),

    /*
    |--------------------------------------------------------------------------
    | RabbitMQ - Notification Service
    |--------------------------------------------------------------------------
    |
    | Used to send notifications.
    |
    | Examples:
    | - Timesheet Approved
    | - Timesheet Rejected
    | - Reminder Notifications
    |
    |--------------------------------------------------------------------------
    */
    RmqModule.register({
      name: NOTIFICATION_SERVICE,
    }),

    /*
    |--------------------------------------------------------------------------
    | Redis Cache Module
    |--------------------------------------------------------------------------
    |
    | Used for:
    | - Caching
    | - Fast Data Retrieval
    | - Temporary Storage
    |
    |--------------------------------------------------------------------------
    */
    RedisCacheModule,

    /*
    |--------------------------------------------------------------------------
    | File Upload Module
    |--------------------------------------------------------------------------
    |
    | Used if timesheets contain:
    | - Attachments
    | - Screenshots
    | - Documents
    |
    |--------------------------------------------------------------------------
    */
    FileUploadModule,

    /*
    |--------------------------------------------------------------------------
    | User Module
    |--------------------------------------------------------------------------
    |
    | Provides user-related functionality.
    |
    |--------------------------------------------------------------------------
    */
    UserModule,

    /*
    |--------------------------------------------------------------------------
    | Employee Module
    |--------------------------------------------------------------------------
    |
    | Provides employee management services.
    |
    |--------------------------------------------------------------------------
    */
    EmployeeModule,

    /*
    |--------------------------------------------------------------------------
    | Socket Notification Module
    |--------------------------------------------------------------------------
    |
    | Used for real-time notifications.
    |
    | Example:
    | Manager approves timesheet
    | → Employee receives instant notification
    |
    |--------------------------------------------------------------------------
    */
    NotifyModule,
  ],

  /*
  |--------------------------------------------------------------------------
  | Controllers
  |--------------------------------------------------------------------------
  |
  | Handles incoming HTTP requests.
  |
  |--------------------------------------------------------------------------
  */
  controllers: [
    TimeSheetsController,
  ],

  /*
  |--------------------------------------------------------------------------
  | Providers
  |--------------------------------------------------------------------------
  |
  | Services available inside this module.
  |
  |--------------------------------------------------------------------------
  */
  providers: [
    /*
    |--------------------------------------------------------------------------
    | Main Business Logic
    |--------------------------------------------------------------------------
    */
    TimeSheetsService,

    /*
    |--------------------------------------------------------------------------
    | Employee Operations
    |--------------------------------------------------------------------------
    */
    EmployeesService,

    /*
    |--------------------------------------------------------------------------
    | Attendance Operations
    |--------------------------------------------------------------------------
    |
    | Used for:
    | - Attendance Validation
    | - Working Hours Calculation
    | - Attendance Integration
    |
    |--------------------------------------------------------------------------
    */
    AttendanceService,
  ],
})

/*
|--------------------------------------------------------------------------
| Exported Module
|--------------------------------------------------------------------------
|
| Makes all registered services/controllers available
| within the Timesheets feature.
|
|--------------------------------------------------------------------------
*/
export class TimeSheetsModule {}