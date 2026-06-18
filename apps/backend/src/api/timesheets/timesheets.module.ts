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


@Module({
  imports: [
    DatabaseModule,
    RmqModule.register({ name: AUTH_SERVICE }),
    RmqModule.register({ name: NOTIFICATION_SERVICE }),
    RedisCacheModule,
    FileUploadModule,
    UserModule,
    EmployeeModule,
    NotifyModule
  ],
  controllers: [TimeSheetsController],
  providers: [
    TimeSheetsService,
    EmployeesService,
    AttendanceService,
  ],
})
export class TimeSheetsModule {}
