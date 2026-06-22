import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Logger,
} from '@nestjs/common';
import {
  CreateTaskDto,
  ListQueryDTO,
  UpdateTaskDto,
} from '@lib/dto';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TasksService } from '../services/task.service';
import { UserDetails } from '@lib/decorators';

/*
|------------------------------------------------------------------------------
| Tasks Controller
|------------------------------------------------------------------------------
|
| This controller manages all Task-related operations.
|
| Responsibilities:
| - Create Task
| - Get All Tasks
| - Get My Tasks
| - Get Task History
| - Get Single Task
| - Change Task Column
| - Update Task
| - Delete Task
|
| Controller -> Service -> Database
|
|--------------------------------------------------------------------------
*/

@ApiTags('TasksApi') // Swagger API Group
@Controller('tasks') // Base Route => /tasks
@ApiBearerAuth() // JWT Authentication Support
export class TasksController {
  /*
  |--------------------------------------------------------------------------
  | Logger
  |--------------------------------------------------------------------------
  |
  | Used for debugging and application logs.
  |
  |--------------------------------------------------------------------------
  */
  private readonly logger = new Logger(
    TasksController.name,
  );

  /*
  |--------------------------------------------------------------------------
  | Dependency Injection
  |--------------------------------------------------------------------------
  |
  | Inject TasksService for business logic.
  |
  |--------------------------------------------------------------------------
  */
  constructor(
    private readonly taskService: TasksService,
  ) { }

  /*
  |--------------------------------------------------------------------------
  | Create Task
  |--------------------------------------------------------------------------
  |
  | Endpoint:
  | POST /tasks/:col
  |
  | Example:
  | POST /tasks/685abc123
  |
  | Purpose:
  | Creates a new task inside a column.
  |
  |--------------------------------------------------------------------------
  */
  @Post(':col')
  async createTask(
    @Param('col') col: string,
    @Body() createTaskDto: CreateTaskDto,
    @UserDetails() user: any,
  ) {
    // Add creator information before saving task
    const data = await this.taskService.createTask(
      {
        ...createTaskDto,
        createdBy: user?._id,
      },
      col,
    );

    return data;
  }

  /*
  |--------------------------------------------------------------------------
  | Get All Tasks
  |--------------------------------------------------------------------------
  |
  | Endpoint:
  | GET /tasks
  |
  | Purpose:
  | Returns all tasks from database.
  |
  |--------------------------------------------------------------------------
  */
  @Get()
  async listAllTasks() {
    const data =
      await this.taskService.listAllTasks();

    return data;
  }

  /*
  |--------------------------------------------------------------------------
  | Get My Tasks
  |--------------------------------------------------------------------------
  |
  | Endpoint:
  | GET /tasks/my-tasks
  |
  | Query Params:
  | ?completedTasks=true
  | ?page=1
  | ?limit=10
  |
  | Purpose:
  | Returns tasks assigned to logged-in user.
  |
  |--------------------------------------------------------------------------
  */
  @Get('my-tasks')
  async getMyTasks(
    @UserDetails() user: any,

    // Filter completed/pending tasks
    @Query('completedTasks')
    completedTasks: boolean,

    @Query() query: ListQueryDTO,
  ) {
    const userId = user?._id;

    return this.taskService.getTasksByUser(
      userId,
      completedTasks,
      query,
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Get Task History
  |--------------------------------------------------------------------------
  |
  | Endpoint:
  | GET /tasks/history/:taskId
  |
  | Example:
  | GET /tasks/history/685abc123
  |
  | Purpose:
  | Returns activity history of a task.
  |
  |--------------------------------------------------------------------------
  */
  @Get('history/:taskId')
  async getAllTaskHistory(
    @Param('taskId') id: string,
  ) {
    const data =
      await this.taskService.getAllTaskHistory(
        id,
      );

    return data;
  }

  /*
  |--------------------------------------------------------------------------
  | Get Single Task
  |--------------------------------------------------------------------------
  |
  | Endpoint:
  | GET /tasks/:id
  |
  | Purpose:
  | Returns task details by Task ID.
  |
  |--------------------------------------------------------------------------
  */
  @Get(':id')
  async getTask(
    @Param('id') id: string,
  ) {
    const data =
      await this.taskService.getTaskById(id);

    return data;
  }

  /*
  |--------------------------------------------------------------------------
  | Change Task Column
  |--------------------------------------------------------------------------
  |
  | Endpoint:
  | PUT /tasks/col-change
  |
  | Purpose:
  | Move task from one column to another.
  |
  | Example:
  |
  | TODO
  |   ↓
  | IN PROGRESS
  |
  |--------------------------------------------------------------------------
  */
  @Put('col-change')
  async changeTaskColumn(
    @Body()
    body: {
      board: string;
      colFrom: string;
      colTo: string;
      task: string;
    },
    @UserDetails() user: any,
  ) {
    const data =
      await this.taskService.changeTaskColumn(
        body.board,     // Board ID
        body.colFrom,   // Source Column
        body.colTo,     // Destination Column
        body.task,      // Task ID
        user?._id,      // User Performing Action
      );

    return data;
  }

  /*
  |--------------------------------------------------------------------------
  | Update Task
  |--------------------------------------------------------------------------
  |
  | Endpoint:
  | PUT /tasks/:id
  |
  | Purpose:
  | Updates task details.
  |
  |--------------------------------------------------------------------------
  */
  @Put(':id')
  async updateTask(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @UserDetails() user: any,
  ) {
    const data =
      await this.taskService.updateTask(
        id,
        {
          ...updateTaskDto,
          updatedBy: user?._id,
        },
      );

    return data;
  }

  /*
  |--------------------------------------------------------------------------
  | Delete Task
  |--------------------------------------------------------------------------
  |
  | Endpoint:
  | DELETE /tasks/:id
  |
  | Request Body:
  | {
  |   "column": "columnId"
  | }
  |
  | Purpose:
  | Deletes task and removes it from column.
  |
  |--------------------------------------------------------------------------
  */
  @Delete(':id')
  async deleteTask(
    @Param('id') id: string,
    @Body() body: { column: string },
  ) {
    const data =
      await this.taskService.deleteTask(
        id,
        body.column,
      );

    return data;
  }
}