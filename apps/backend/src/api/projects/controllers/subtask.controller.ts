import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { SubTasksService } from '../services/subtask.service';
import {
  CreateSubtaskDto,
  UpdateSubtaskDto,
} from '@lib/dto';
import { UserDetails } from '@lib/decorators';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

/*
|--------------------------------------------------------------------------
| Subtask Controller
|--------------------------------------------------------------------------
|
| This controller manages Task Subtasks.
|
| Responsibilities:
| - Create Subtask
| - Get All Subtasks
| - Update Subtask
| - Delete Subtask
|
| Controller -> Service -> Database
|
|--------------------------------------------------------------------------
*/

@ApiTags('Subtasks') // Swagger API Group
@Controller('subtask') // Base Route => /subtask
@ApiBearerAuth() // Enables JWT Authentication in Swagger
export class SubtaskController {
  /*
  |--------------------------------------------------------------------------
  | Dependency Injection
  |--------------------------------------------------------------------------
  |
  | Inject SubTasksService for business logic.
  |
  |--------------------------------------------------------------------------
  */
  constructor(
    private readonly subtaskService: SubTasksService,
  ) {}

  /*
  |--------------------------------------------------------------------------
  | Create Subtask
  |--------------------------------------------------------------------------
  |
  | Endpoint:
  | POST /subtask
  |
  | Purpose:
  | Creates a new subtask under a task.
  |
  |--------------------------------------------------------------------------
  */
  @Post()
  async createSubtask(
    @Body() subtaskDto: CreateSubtaskDto,
    @UserDetails() user: any,
  ) {
    // Add creator information before saving
    return await this.subtaskService.createSubtask({
      ...subtaskDto,
      createdBy: user?._id,
    });
  }

  /*
  |--------------------------------------------------------------------------
  | Get All Subtasks
  |--------------------------------------------------------------------------
  |
  | Endpoint:
  | GET /subtask
  |
  | Query Parameters:
  | ?task=<taskId>
  | ?user=<userId>
  |
  | Purpose:
  | Returns all subtasks based on task/user filters.
  |
  |--------------------------------------------------------------------------
  */
  @Get()
  async getSubtasks(
    @Query()
    query: {
      task: string;
      user: string;
    },
    @UserDetails() user: any,
  ) {
    // Fetch subtasks based on filters
    return await this.subtaskService.getAllSubtasks(
      query,
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Update Subtask
  |--------------------------------------------------------------------------
  |
  | Endpoint:
  | PUT /subtask/:id
  |
  | Example:
  | PUT /subtask/685abc123
  |
  | Purpose:
  | Updates subtask details.
  |
  |--------------------------------------------------------------------------
  */
  @Put(':id')
  async updateSubtask(
    @Param('id') id: string,
    @Body() subtaskDto: UpdateSubtaskDto,
    @UserDetails() user: any,
  ) {
    // Add updater information before update
    return await this.subtaskService.updateSubtasks(
      id,
      {
        ...subtaskDto,
        updatedBy: user?._id,
      },
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Delete Subtask
  |--------------------------------------------------------------------------
  |
  | Endpoint:
  | DELETE /subtask/:id
  |
  | Example:
  | DELETE /subtask/685abc123
  |
  | Purpose:
  | Deletes a subtask.
  |
  |--------------------------------------------------------------------------
  */
  @Delete(':id')
  async deleteSubtask(
    @Param('id') id: string,
  ) {
    // Remove subtask from database
    return await this.subtaskService.deleteSubtasks(
      id,
    );
  }
}