import { CreateProjectDto, ListQueryDTO, UpdateProjectDto } from '@lib/dto';
import { AccessGuard } from '@lib/guards';
import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ProjectsService } from '../services/projects.service';
import { HasAccess, UserDetails, UserTypeAccess } from '@lib/decorators';
import {
  EMPLOYEE_TYPE_MAP,
  USER_TYPE_MAP,
} from '@lib/database';

/*
|--------------------------------------------------------------------------
| Projects Controller
|--------------------------------------------------------------------------
|
| This controller manages all Project-related operations.
|
| Responsibilities:
| - Create Project
| - Project Dashboard
| - List Projects
| - List My Projects
| - List Projects by User/Company
| - Get Single Project
| - Update Project
| - Delete Project
|
| Controller -> Service -> Database
|
|--------------------------------------------------------------------------
*/

@ApiTags('ProjectsApi') // Swagger API Group
@UseGuards(AccessGuard) // Protect all APIs with authentication
@ApiBearerAuth() // JWT Authentication in Swagger
@Controller('projects') // Base Route => /projects
export class ProjectsController {
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
    ProjectsController.name,
  );

  /*
  |--------------------------------------------------------------------------
  | Dependency Injection
  |--------------------------------------------------------------------------
  |
  | Inject ProjectsService for business logic.
  |
  |--------------------------------------------------------------------------
  */
  constructor(
    private readonly projectService: ProjectsService,
  ) { }

  /*
  |--------------------------------------------------------------------------
  | Create Project
  |--------------------------------------------------------------------------
  |
  | Endpoint:
  | POST /projects
  |
  | Access:
  | Employee Only
  |
  | Purpose:
  | Creates a new project.
  |
  |--------------------------------------------------------------------------
  */
  @Post()
  @UserTypeAccess(EMPLOYEE_TYPE_MAP.EMPLOYEE)
  @HasAccess()
  async createProject(
    @Body() body: CreateProjectDto,
    @UserDetails() user: any,
  ) {
    /*
    |--------------------------------------------------------------------------
    | Set Admin
    |--------------------------------------------------------------------------
    |
    | If admin is not provided in request,
    | current user becomes project admin.
    |
    |--------------------------------------------------------------------------
    */
    return await this.projectService.createProject({
      ...body,
      admin: body.admin ?? user?._id,
    });
  }

  /*
  |--------------------------------------------------------------------------
  | Project Dashboard
  |--------------------------------------------------------------------------
  |
  | Endpoint:
  | GET /projects/project-dashboard
  |
  | Access:
  | Employee Only
  |
  | Purpose:
  | Returns project dashboard statistics.
  |
  |--------------------------------------------------------------------------
  */
  @Get('project-dashboard')
  @UserTypeAccess(USER_TYPE_MAP.EMPLOYEE)
  @HasAccess()
  async projectDashboard(
    @UserDetails() user: any,
  ) {
    const data =
      await this.projectService.projectDashboard(
        user,
      );

    return data;
  }

  /*
  |--------------------------------------------------------------------------
  | List All Projects
  |--------------------------------------------------------------------------
  |
  | Endpoint:
  | GET /projects
  |
  | Query Params:
  | - page
  | - limit
  | - keyword
  | - sort
  | - sortBy
  |
  | Purpose:
  | Returns paginated list of projects.
  |
  |--------------------------------------------------------------------------
  */
  @Get()
  @HasAccess()
  async listProjects(
    @Query() query: ListQueryDTO,
  ) {
    const {
      keyword,
      limit,
      page,
      sort,
      sortBy,
    } = query;

    const data =
      await this.projectService.listAllProject(
        page,
        limit,
        keyword,
        sortBy,
        sort,
      );

    return data;
  }

  /*
  |--------------------------------------------------------------------------
  | List My Projects
  |--------------------------------------------------------------------------
  |
  | Endpoint:
  | GET /projects/list-my-projects
  |
  | Purpose:
  | Returns projects assigned to current user.
  |
  |--------------------------------------------------------------------------
  */
  @Get('list-my-projects')
  async listMyProjects(
    @Query() query: ListQueryDTO,
    @UserDetails() user: any,
  ) {
    const {
      keyword,
      limit,
      page,
      sort,
      sortBy,
    } = query;

    const data =
      await this.projectService.listProjectsByUser(
        user?._id,
        page,
        limit,
        keyword,
        sortBy,
        sort,
      );

    return data;
  }

  /*
  |--------------------------------------------------------------------------
  | List Projects By User Or Company
  |--------------------------------------------------------------------------
  |
  | Endpoint:
  | GET /projects/list-by-user-or-company
  |
  | Example:
  | ?user=123
  | ?company=456
  |
  | Purpose:
  | Returns projects belonging to a user
  | or company.
  |
  |--------------------------------------------------------------------------
  */
  @Get('list-by-user-or-company')
  @HasAccess()
  async listProjectsByUsersOrCompany(
    @UserDetails() user: any,
    @Query('company') company?: string,
    @Query('user') userId?: string,
  ) {
    const data =
      await this.projectService
        .listProjectsByUserOrCompany(
          userId,
          company,
        );

    return data;
  }

  /*
  |--------------------------------------------------------------------------
  | Get Single Project
  |--------------------------------------------------------------------------
  |
  | Endpoint:
  | GET /projects/:id
  |
  | Purpose:
  | Returns project details using project ID.
  |
  |--------------------------------------------------------------------------
  */
  @Get(':id')
  async getProject(
    @Param('id') id: string,
    @UserDetails() user: any,
  ) {
    const data =
      await this.projectService.getProjectById(id);

    return data;
  }

  /*
  |--------------------------------------------------------------------------
  | Update Project
  |--------------------------------------------------------------------------
  |
  | Endpoint:
  | PUT /projects/:id
  |
  | Access:
  | Employee Only
  |
  | Purpose:
  | Updates project information.
  |
  |--------------------------------------------------------------------------
  */
  @Put(':id')

  // TODO: Remove after testing
  @UserTypeAccess(USER_TYPE_MAP.EMPLOYEE)
  @HasAccess(EMPLOYEE_TYPE_MAP.EMPLOYEE)
  async updateProject(
    @Param('id') id: string,
    @Body() body: UpdateProjectDto,
    @UserDetails() user: any,
  ) {
    const data =
      await this.projectService.updateProject(
        id,
        body,
        user,
      );

    return data;
  }

  /*
  |--------------------------------------------------------------------------
  | Delete Project
  |--------------------------------------------------------------------------
  |
  | Endpoint:
  | DELETE /projects/:id
  |
  | Purpose:
  | Deletes project from database.
  |
  |--------------------------------------------------------------------------
  */
  @Delete(':id')
  @HasAccess()
  async deleteProject(
    @Param('id') id: string,
  ) {
    const data =
      await this.projectService.deleteProject(id);

    return data;
  }
}