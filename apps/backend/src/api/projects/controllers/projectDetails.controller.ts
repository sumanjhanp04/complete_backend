import {
  ProjectCredentialCreateDto,
  ProjectDocumentCreateDto,
} from '@lib/dto';
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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ProjectDetailsService } from '../services/project-details.service';
import { UserDetails } from '@lib/decorators';

/*
|--------------------------------------------------------------------------
| Project Details Controller
|--------------------------------------------------------------------------
|
| This controller manages:
| - Project Documents
| - Project Credentials
|
| Responsibilities:
| - Create Documents
| - Get Documents
| - Update Documents
| - Delete Documents
| - Create Credentials
| - Get Credentials
|
| Controller -> Service -> Database
|
|--------------------------------------------------------------------------
*/

@ApiTags('ProjectsApi') // Swagger API Group Name
@Controller('project-details') // Base Route => /project-details
@ApiBearerAuth() // Enables JWT Authentication in Swagger
export class ProjectDetailsController {
  /*
  |--------------------------------------------------------------------------
  | Logger
  |--------------------------------------------------------------------------
  |
  | Used for debugging and application logs.
  |
  |--------------------------------------------------------------------------
  */
  private logger = new Logger(ProjectDetailsController.name);

  /*
  |--------------------------------------------------------------------------
  | Dependency Injection
  |--------------------------------------------------------------------------
  |
  | Inject ProjectDetailsService for business logic.
  |
  |--------------------------------------------------------------------------
  */
  constructor(
    private readonly projectDetailsService: ProjectDetailsService,
  ) { }

  /*
  |--------------------------------------------------------------------------
  | Create Project Document
  |--------------------------------------------------------------------------
  |
  | Endpoint:
  | POST /project-details/documents
  |
  | Purpose:
  | Creates a new document associated with a project.
  |
  |--------------------------------------------------------------------------
  */
  @Post('documents')
  async createDocuments(
    @Body() body: ProjectDocumentCreateDto,
    @UserDetails() user: any,
  ) {
    // Add creator information before saving
    const data =
      await this.projectDetailsService.createProjectDocument({
        ...body,
        createdBy: user?._id,
      });

    return data;
  }

  /*
  |--------------------------------------------------------------------------
  | Get All Project Documents
  |--------------------------------------------------------------------------
  |
  | Endpoint:
  | GET /project-details/documents?projectId=<id>
  |
  | Purpose:
  | Fetch all documents belonging to a project.
  |
  |--------------------------------------------------------------------------
  */
  @Get('documents')
  async getDocuments(
    @Query() qry: { projectId: string },
  ) {
    const { projectId } = qry;

    // Retrieve project documents
    const data =
      await this.projectDetailsService.listProjectDocuments(
        projectId,
      );

    return data;
  }

  /*
  |--------------------------------------------------------------------------
  | Update Project Document
  |--------------------------------------------------------------------------
  |
  | Endpoint:
  | PATCH /project-details/documents/:id
  |
  | Purpose:
  | Updates a project document.
  |
  | Note:
  | Currently passing null as update data.
  | Service may contain internal update logic.
  |
  |--------------------------------------------------------------------------
  */
  @Patch('documents/:id')
  async getDocumentsById(
    @Param('id') id: string,
  ) {
    const data =
      await this.projectDetailsService.updateProjectDocument(
        id,
        null,
      );

    return data;
  }

  /*
  |--------------------------------------------------------------------------
  | Delete Project Document
  |--------------------------------------------------------------------------
  |
  | Endpoint:
  | DELETE /project-details/documents/:id
  |
  | Purpose:
  | Deletes a project document.
  |
  |--------------------------------------------------------------------------
  */
  @Delete('documents/:id')
  async deleteDocuments(
    @Param('id') id: string,
  ) {
    const data =
      await this.projectDetailsService.deleteProjectDocument(
        id,
      );

    return data;
  }

  /*
  |--------------------------------------------------------------------------
  | Create Project Credential
  |--------------------------------------------------------------------------
  |
  | Endpoint:
  | POST /project-details/credential
  |
  | Purpose:
  | Stores project credentials such as:
  | - Login IDs
  | - Passwords
  | - API Keys
  | - Hosting Credentials
  |
  |--------------------------------------------------------------------------
  */
  @Post('credential')
  async createCredential(
    @Body() body: ProjectCredentialCreateDto,
    @UserDetails() user: any,
  ) {
    // Add creator information before saving
    const data =
      await this.projectDetailsService.createProjectCredential({
        ...body,
        createdBy: user?._id,
      });

    return data;
  }

  /*
  |--------------------------------------------------------------------------
  | Get Project Credentials
  |--------------------------------------------------------------------------
  |
  | Endpoint:
  | GET /project-details/credential?projectId=<id>
  |
  | Purpose:
  | Fetch all credentials associated with a project.
  |
  |--------------------------------------------------------------------------
  */
  @Get('credential')
  async getCredential(
    @Query() qry: { projectId: string },
    @UserDetails() user: any,
  ) {
    const { projectId } = qry;

    // Retrieve project credentials
    const data =
      await this.projectDetailsService.listProjectCredentials(
        projectId,
      );

    return data;
  }
}