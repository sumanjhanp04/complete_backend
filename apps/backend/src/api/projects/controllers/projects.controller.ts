import { CreateProjectDto, ListQueryDTO, UpdateProjectDto } from '@lib/dto';
import { AccessGuard } from '@lib/guards';
import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Logger,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ProjectsService } from '../services/projects.service';
import { HasAccess, UserDetails, UserTypeAccess } from '@lib/decorators';
import {  EMPLOYEE_TYPE_MAP, USER_TYPE_MAP, } from '@lib/database';

@ApiTags('ProjectsApi')
@UseGuards(AccessGuard)
@ApiBearerAuth()
@Controller('projects')
export class ProjectsController {
  private readonly logger = new Logger(ProjectsController.name);

  constructor(private readonly projectService: ProjectsService) {}

  @Post()
  @UserTypeAccess(EMPLOYEE_TYPE_MAP.EMPLOYEE)
  @HasAccess()
  async createProject(
    @Body() body: CreateProjectDto,
    @UserDetails() user: any,
  ) {
    // const data = await this.projectsClient.send({ cmd: PROJECTS_API_MAPS.CREATE_PROJECT }, { ...body, admin: body.admin ?? token?.user?._id }).toPromise()
    return await this.projectService.createProject({
      ...body,
      admin: body.admin ?? user?._id,
    });
  }

  @Get('project-dashboard')
  @UserTypeAccess(USER_TYPE_MAP.EMPLOYEE)
  @HasAccess()
  async projectDashboard(
    @UserDetails() user: any,
  ) {
    // const data = await this.projectsClient.send({ cmd: PROJECTS_API_MAPS.PROJECT_DASHBOARD }, { user: user ?? token?.user?._id, company }).toPromise();
    const data = await this.projectService.projectDashboard(user);
    return data;
  }

  @Get()
  @HasAccess()
  async listProjects(@Query() query: ListQueryDTO) {
    const { keyword, limit, page, sort, sortBy } = query;
    const data = await this.projectService.listAllProject(
      page,
      limit,
      keyword,
      sortBy,
      sort,
    );
    return data;
  }

  @Get('list-my-projects')
  async listMyProjects(@Query() query: ListQueryDTO, @UserDetails() user: any) {
    // const data = await this.projectsClient.send({ cmd: PROJECTS_API_MAPS.LIST_MY_PROJECTS }, token?.user?._id).toPromise();
    const { keyword, limit, page, sort, sortBy } = query;
    const data = await this.projectService.listProjectsByUser(
      user?._id,
      page,
      limit,
      keyword,
      sortBy,
      sort,
    );
    return data;
  }

  @Get('list-by-user-or-company')
  @HasAccess()
  async listProjectsByUsersOrCompany(
    @UserDetails() user: any,
    @Query('company') company?: string,
    @Query('user') userId?: string,
  ) {
    // const data = await this.projectsClient.send({ cmd: PROJECTS_API_MAPS.LIST_PROJECTS }, { user: user ?? token?.user?._id, company }).toPromise();
    const data = await this.projectService.listProjectsByUserOrCompany(
      userId,
      company,
    );
    return data;
  }

  @Get(':id')
  async getProject(@Param('id') id: string, @UserDetails() user: any) {
    // const data = await this.projectsClient.send({ cmd: PROJECTS_API_MAPS.GET_PROJECT }, id).toPromise();
    const data = await this.projectService.getProjectById(id);
    return data;
  }

  @Put(':id')
  // Todo: remove it after the testing
  @UserTypeAccess(USER_TYPE_MAP.EMPLOYEE)
  @HasAccess(EMPLOYEE_TYPE_MAP.EMPLOYEE)
  async updateProject(
    @Param('id') id: string,
    @Body() body: UpdateProjectDto,
    @UserDetails() user: any,
  ) {
    // const data = await this.projectsClient.send({ cmd: PROJECTS_API_MAPS.UPDATE_PROJECT }, { id, body }).toPromise();
    const data = await this.projectService.updateProject(id, body, user);
    return data;
  }

  @Delete(':id')
  @HasAccess()
  async deleteProject(@Param('id') id: string) {
    // const data = await this.projectsClient.send({ cmd: PROJECTS_API_MAPS.DELETE_PROJECT }, { id }).toPromise();
    const data = await this.projectService.deleteProject(id);
    return data;
  }
}
