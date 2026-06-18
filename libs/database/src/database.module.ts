import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Attendance,
  Boards,
  Breaks,
  Client,
  Columns,
  Comments,
  Company,
  Conversation,
  CronTab,
  CronTabSchema,
  Department,
  Designation,
  Employee,
  Notification,
  NotificationSchema,
  ProjectCategory,
  ProjectCategorySchema,
  ProjectCredential,
  ProjectDocument,
  ProjectSubCategory,
  ProjectSubCategorySchema,
  Projects,
  ProjectsHistory,
  Role,
  Room,
  Seen,
  SeenSchema,
  SubTasks,
  SubTasksSchema,
  Tasks,
  TasksHistory,
  TimeSheet,
  TimeSheetComment,
  TimeSheetCommentSchema,
  TimeSheetSchema,
  User,
  attendanceSchema,
  boardsSchema,
  breakSchema,
  clientSchema,
  columnsSchema,
  commentsSchema,
  companySchema,
  conversationSchema,
  departmentSchema,
  designationSchema,
  employeeSchema,
  projectCredentialSchema,
  projectDocumentSchema,
  projectsHistorySchema,
  projectsSchema,
  roleSchema,
  tasksHistorySchema,
  tasksSchema,
  userSchema,
} from './schemas';
import RoomSchema from './schemas/conversation/room.schema';
import { Calendar, CalendarSchema } from './schemas/calender/calendar.schema';
import { Teams, TeamsSchema } from './schemas/authentication/teams.schema';
import { Shift, ShiftSchema } from './schemas/employees/shift.schema';
import { EmergencyContact, EmergencyContactSchema } from './schemas/employees/emergencyContact.schema';
import { Address, AddressSchema } from './schemas/employees/address.schema';
import { FileCredential, FileCredentialSchema } from './schemas/credentials/file-credentials.schema';
import { CredentialsSchema } from './schemas/credentials/credentials.schema';
import { Credentials } from 'aws-sdk';
import { AccountCredentials, AccountCredentialsSchema } from './schemas/credentials/account-credentials.schema';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),

    MongooseModule.forFeature([
      { name: User.name, schema: userSchema },
      { name: Employee.name, schema: employeeSchema },
      { name: Role.name, schema: roleSchema },
      { name: Client.name, schema: clientSchema },
      { name: Designation.name, schema: designationSchema },
      { name: Department.name, schema: departmentSchema },
      { name: Company.name, schema: companySchema },
      { name: Attendance.name, schema: attendanceSchema },
      { name: Breaks.name, schema: breakSchema },
      { name: Projects.name, schema: projectsSchema },
      { name: Boards.name, schema: boardsSchema },
      { name: Columns.name, schema: columnsSchema },
      { name: Tasks.name, schema: tasksSchema },
      { name: SubTasks.name, schema: SubTasksSchema },
      { name: Comments.name, schema: commentsSchema },
      { name: ProjectsHistory.name, schema: projectsHistorySchema },
      { name: TasksHistory.name, schema: tasksHistorySchema },
      { name: ProjectDocument.name, schema: projectDocumentSchema },
      { name: ProjectCategory.name, schema: ProjectCategorySchema },
      { name: ProjectSubCategory.name, schema: ProjectSubCategorySchema },
      { name: ProjectCredential.name, schema: projectCredentialSchema },
      { name: Conversation.name, schema: conversationSchema },
      { name: Room.name, schema: RoomSchema },
      { name: Seen.name, schema: SeenSchema },
      { name: Calendar.name, schema: CalendarSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: CronTab.name, schema: CronTabSchema },
      { name: Teams.name, schema: TeamsSchema },
      { name: Shift.name, schema: ShiftSchema },
      { name: EmergencyContact.name, schema: EmergencyContactSchema },
      { name: Address.name, schema: AddressSchema },
      { name: FileCredential.name, schema: FileCredentialSchema },
      { name: Credentials.name, schema: CredentialsSchema },
      { name: AccountCredentials.name, schema: AccountCredentialsSchema },
      { name: TimeSheet.name, schema: TimeSheetSchema },
      { name: TimeSheetComment.name, schema: TimeSheetCommentSchema },
    ]),
  ],
  providers: [],
  exports: [MongooseModule],
})
export class DatabaseModule { }
