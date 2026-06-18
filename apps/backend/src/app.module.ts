import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './api/user/user.module';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ExitGateInterceptor, GlobalErrorFilter } from '@lib/interceptors';
import { EmployeeModule } from './api/employee/employee.module';
import { ClientModule } from './api/clients/clients.module';
import { DatabaseModule } from '@lib/database';
import { ProjectsModule } from './api/projects/projects.module';
import { CalendarModule } from './api/calendar/calendar.module';
import { CredentialsModule } from './api/credentials/credentials.module';
import { NoticeModule } from './api/notice/notice.module';
import { NotifyModule } from './socket/notify/notify.module';
import { EventModule } from '@lib/event';
import { LeaveModule } from './api/leave/leave.module';
import { TimeSheetsModule } from './api/timesheets/timesheets.module';
import { ChatModule } from './socket/chat/chat.module';

@Module({
  imports: [
    EventModule,
    DatabaseModule,
    UserModule,
    EmployeeModule,
    ClientModule,
    ProjectsModule,
    CalendarModule,
    CredentialsModule,
    NoticeModule, // Register the FileModule here
    NotifyModule,
    ChatModule,
    LeaveModule,
    TimeSheetsModule
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ExitGateInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalErrorFilter,
    },
    AppService,
  ],
})
export class AppModule { }
