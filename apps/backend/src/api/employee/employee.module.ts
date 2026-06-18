import { Module } from '@nestjs/common';
import { EmployeeController } from './controller/employee.controller';
import { EmployeesService } from './service/employee.service';
import { DatabaseModule } from '@lib/database';
import { RmqModule } from '@lib/rmq';
import { AUTH_SERVICE, NOTIFICATION_SERVICE } from '@lib/common';
import { AttendanceService } from './service/attendance.service';
import { DepartmentsService } from './service/departments.service';
import { AttendanceController } from './controller/attendance.controller';
import { TeamsController } from './controller/team.controller';
import { TeamService } from './service/team.service';
import { ShiftController } from './controller/shift.controller';
import { ShiftService } from './service/shift.service';
import { RedisCacheModule } from 'libs/cache/src';
import { FileUploadModule } from '@app/file-upload';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    DatabaseModule,
    RmqModule.register({ name: AUTH_SERVICE }),
    RmqModule.register({ name: NOTIFICATION_SERVICE }),
    RedisCacheModule,
    FileUploadModule,
    UserModule
  ],
  controllers: [
    EmployeeController,
    AttendanceController,
    TeamsController,
    ShiftController,
  ],
  providers: [
    EmployeesService,
    AttendanceService,
    DepartmentsService,
    TeamService,
    ShiftService,
  ],
  exports:[
    EmployeesService
  ]
})
export class EmployeeModule {}
