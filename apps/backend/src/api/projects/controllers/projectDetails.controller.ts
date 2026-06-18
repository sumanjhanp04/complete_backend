import { ProjectCredentialCreateDto, ProjectDocumentCreateDto } from '@lib/dto';
import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Response, response } from 'express';
import { ProjectDetailsService } from '../services/project-details.service';
import { UserDetails } from '@lib/decorators';

@ApiTags('ProjectsApi')
@Controller('project-details')
@ApiBearerAuth()
export class ProjectDetailsController {
  private logger = new Logger(ProjectDetailsController.name);

  constructor(private readonly projectDetailsService: ProjectDetailsService) {}

  @Post('documents')
  async createDocuments(
    @Body() body: ProjectDocumentCreateDto,
    @UserDetails() user: any,
  ) {
    // const data = await this.projectsClient
    //   .send(
    //     { cmd: PROJECT_DETAILS_API_MAPS.CREATE_PROJECT_DOCUMENTS },
    //     { ...body, createdBy: token?.user?._id },
    //   )
    //   .toPromise();
    const data = await this.projectDetailsService.createProjectDocument({
      ...body,
      createdBy: user?._id,
    });
    return data;
  }

  @Get('documents')
  async getDocuments(@Query() qry: { projectId: string }) {
    const { projectId } = qry;
    const data =
      await this.projectDetailsService.listProjectDocuments(projectId);
    return data;
  }

  @Patch('documents/:id')
  async getDocumentsById(@Param('id') id: string) {
    const data = await this.projectDetailsService.updateProjectDocument(
      id,
      null,
    );
    return data;
  }

  @Delete('documents/:id')
  async deleteDocuments(@Param('id') id: string) {
    // const { token } = response.locals;
    // const data = await this.projectsClient
    //   .send({ cmd: PROJECT_DETAILS_API_MAPS.DELETE_PROJECT_DOCUMENTS }, { id })
    //   .toPromise();
    const data = await this.projectDetailsService.deleteProjectDocument(id);
    return data;
  }

  @Post('credential')
  async createCredential(
    @Body() body: ProjectCredentialCreateDto,
    @UserDetails() user: any,
  ) {
    const data = await this.projectDetailsService.createProjectCredential({
      ...body,
      createdBy: user?._id,
    });
    return data;
  }

  @Get('credential')
  async getCredential(
    @Query() qry: { projectId: string },
    @UserDetails() user: any,
  ) {
    const { projectId } = qry;
    const data =
      await this.projectDetailsService.listProjectCredentials(projectId);
    return data;
  }
}
