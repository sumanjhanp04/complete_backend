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
import { CreateTaskDto, ListQueryDTO, UpdateTaskDto } from '@lib/dto';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TasksService } from '../services/task.service';
import { UserDetails } from '@lib/decorators';
@ApiTags('TasksApi')
@Controller('tasks')
@ApiBearerAuth()
export class TasksController {
  private readonly logger = new Logger(TasksController.name)
  constructor(private readonly taskService: TasksService) {}

  @Post(':col')
  async createTask(
    @Param('col') col: string,
    @Body() createTaskDto: CreateTaskDto,
    @UserDetails() user: any,
  ) {
    const data = await this.taskService.createTask(
      { ...createTaskDto, createdBy: user?._id },
      col,
    );
    return data;
  }

  @Get()
  async listAllTasks() {
    const data = await this.taskService.listAllTasks();
    return data;
  }

  @Get('my-tasks')
  async getMyTasks(
    @UserDetails() user: any,
    @Query("completedTasks") completedTasks: boolean,
    @Query() query: ListQueryDTO
  ) {
    const userId = user?._id;
    
    return this.taskService.getTasksByUser(userId, completedTasks, query);
  }

  @Get('history/:taskId')
  async getAllTaskHistory(@Param('taskId') id: string) {
    const data = await this.taskService.getAllTaskHistory(id);
    return data;
  }

  @Get(':id')
  async getTask(@Param('id') id: string) {
    // const data = await this.tasksClient.send({ cmd: TASK_API_MAPS.GET_TASK }, id).toPromise();
    const data = await this.taskService.getTaskById(id);
    return data;
  }

  @Put('col-change')
  async changeTaskColumn(
    @Body()
    body: { board: string; colFrom: string; colTo: string; task: string },
    @UserDetails() user: any,
  ) {
    const data = await this.taskService.changeTaskColumn(
      body.board,
      body.colFrom,
      body.colTo,
      body.task,
      user?._id,
    );
    return data;
  }

  @Put(':id')
  async updateTask(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @UserDetails() user: any,
  ) {
    const data = await this.taskService.updateTask(id, {
      ...updateTaskDto,
      updatedBy: user?._id,
    });
    return data;
  }

  @Delete(':id')
  async deleteTask(@Param('id') id: string, @Body() body: { column: string }) {
    const data = await this.taskService.deleteTask(id, body.column);
    return data;
  }
}
