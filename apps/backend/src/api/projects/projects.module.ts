import { Module } from '@nestjs/common';
import { ProjectsService } from './services/projects.service';
import { ProjectsController } from './controllers/projects.controller';
import { BoardsController } from './controllers/boards.controller';
import { ColumnsController } from './controllers/columns.controller';
import { CommentsController } from './controllers/comments.controller';
import { TasksController } from './controllers/tasks.controller';
import { ProjectDetailsController } from './controllers/projectDetails.controller';
import { ProjectsHistoryController } from './controllers/project-history.controller';
import { BoardsService } from './services/board.service';
import { ColumnsService } from './services/column.service';
import { CommentsService } from './services/comments.service';
import { TasksService } from './services/task.service';
import { ProjectDetailsService } from './services/project-details.service';
import { ProjectsHistoryService } from './services/project-history.service';
import { DatabaseModule } from '@lib/database';
import { RmqModule } from '@lib/rmq';
import { NOTIFICATION_SERVICE } from '@lib/common';
import { SubtaskController } from './controllers/subtask.controller';
import { SubTasksService } from './services/subtask.service';
import { ProjectCategoryController } from './controllers/category.controller';
import { ProjectCategoryService } from './services/category.service';
import { ClientModule } from '../clients/clients.module';

@Module({
  imports: [DatabaseModule, ClientModule, RmqModule.register({ name: NOTIFICATION_SERVICE })],
  controllers: [
    ProjectsController,
    BoardsController,
    ColumnsController,
    CommentsController,
    TasksController,
    ProjectDetailsController,
    ProjectsHistoryController,
    SubtaskController,
    ProjectCategoryController
  ],
  providers: [
    ProjectsService,
    BoardsService,
    ColumnsService,
    CommentsService,
    TasksService,
    ProjectDetailsService,
    ProjectsHistoryService,
    SubTasksService,
    ProjectCategoryService
  ],
})
export class ProjectsModule {}
