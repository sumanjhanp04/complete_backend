import {
  Controller,
  Post,
  Body,
} from '@nestjs/common';
import { CreateProjectHistoryDto } from '@lib/dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ProjectsHistoryService } from '../services/project-history.service';

/*
|--------------------------------------------------------------------------
| Projects History Controller
|--------------------------------------------------------------------------
|
| This controller manages Project History records.
|
| Responsibilities:
| - Create Project History
|
| Project History is generally used for:
| - Activity Logs
| - Audit Tracking
| - Status Changes
| - User Actions
| - Project Updates
|
| Controller -> Service -> Database
|
|--------------------------------------------------------------------------
*/

@ApiTags('ProjectHistoryApi') // Swagger API Group Name
@Controller('projects-history') // Base Route => /projects-history
@ApiBearerAuth() // Enables JWT Authentication in Swagger
export class ProjectsHistoryController {
  /*
  |--------------------------------------------------------------------------
  | Dependency Injection
  |--------------------------------------------------------------------------
  |
  | Inject ProjectsHistoryService for business logic.
  |
  |--------------------------------------------------------------------------
  */
  constructor(
    private readonly projectHistoryService: ProjectsHistoryService,
  ) { }

  /*
  |--------------------------------------------------------------------------
  | Create Project History
  |--------------------------------------------------------------------------
  |
  | Endpoint:
  | POST /projects-history
  |
  | Purpose:
  | Creates a new project history record.
  |
  | Examples:
  | - Project Created
  | - Project Updated
  | - Task Assigned
  | - Status Changed
  | - User Added
  |
  |--------------------------------------------------------------------------
  */
  @Post()
  async createHistory(
    @Body() createProjectHistoryDto: CreateProjectHistoryDto,
  ) {
    /*
    |--------------------------------------------------------------------------
    | Save History Record
    |--------------------------------------------------------------------------
    |
    | Sends data to service layer and stores it in database.
    |
    |--------------------------------------------------------------------------
    */
    const data = await this.projectHistoryService.createHistory(
      createProjectHistoryDto,
    );

    return data;
  }
}