import { Module } from '@nestjs/common';
import { LeaveService } from './leave.service';
import { LeaveController } from './leave.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { LeaveType, LeaveTypeSchema } from '@lib/database/schemas/leave/leaveType.schema';
import { FileUploadModule } from '@app/file-upload';
import { RedisCacheModule } from '@app/cache/cache.module';
import { LeaveRequest, LeaveRequestSchema } from '@lib/database/schemas/leave/leaveRequest.schema';
import { EmployeeLeaveBalance, EmployeeLeaveSchema } from '@lib/database/schemas/leave/employeeLeaveBalance.schema';
import { Employee, employeeSchema, User, userSchema } from '@lib/database';
import { LeaveHistory, LeaveHistorySchema } from '@lib/database/schemas/leave/leaveHistory.schema';


@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LeaveType.name, schema: LeaveTypeSchema },
      { name: LeaveRequest.name, schema: LeaveRequestSchema },
      { name: EmployeeLeaveBalance.name, schema: EmployeeLeaveSchema },
      { name: Employee.name, schema: employeeSchema },
      { name: LeaveHistory.name, schema: LeaveHistorySchema },
      { name: User.name, schema: userSchema },
    ]),
    RedisCacheModule,
    FileUploadModule,
  ],
  controllers: [LeaveController],
  providers: [LeaveService],
})
export class LeaveModule {}
