import { CreateBoardDto, UpdateBoardDto } from '@lib/dto';
import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  Delete,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BoardsService } from '../services/board.service';
import { AccessGuard } from '@lib/guards';
import { HasAccess, UserDetails } from '@lib/decorators';

/*
|--------------------------------------------------------------------------
| Boards Controller
|--------------------------------------------------------------------------
|
| This controller handles all Board-related APIs.
|
| Responsibilities:
| - Create Board
| - Get All Boards
| - Get User Boards
| - Get Single Board
| - Update Board
| - Delete Board
|
| Controller -> Service -> Database
|
|--------------------------------------------------------------------------
*/

@ApiTags('BoardsApi') // Swagger API Group Name
@UseGuards(AccessGuard) // Protect all routes using JWT/Auth Guard
@Controller('boards') // Base Route => /boards
@ApiBearerAuth() // Swagger JWT Authorization Support
export class BoardsController {
  /*
  |--------------------------------------------------------------------------
  | Dependency Injection
  |--------------------------------------------------------------------------
  |
  | Inject BoardsService to handle business logic.
  |
  |--------------------------------------------------------------------------
  */
  constructor(private readonly boardsService: BoardsService) { }

  /*
  |--------------------------------------------------------------------------
  | Create Board
  |--------------------------------------------------------------------------
  |
  | Endpoint:
  | POST /boards
  |
  | Purpose:
  | Creates a new board and stores the creator's ID.
  |
  |--------------------------------------------------------------------------
  */
  @Post()
  async createBoard(
    @Body() body: CreateBoardDto,
    @UserDetails() user: any,
  ) {
    // Add logged-in user as creator
    const data = await this.boardsService.createBoard({
      ...body,
      createdBy: user?._id,
    });

    return data;
  }

  /*
  |--------------------------------------------------------------------------
  | Get All Boards
  |--------------------------------------------------------------------------
  |
  | Endpoint:
  | GET /boards?project=<projectId>
  |
  | Purpose:
  | Returns all boards belonging to a project.
  |
  |--------------------------------------------------------------------------
  */
  @Get()
  @HasAccess() // Custom Permission Check
  async listAllBoards(
    @Query('project') project: string,
  ) {
    // Fetch all boards of a project
    const data = await this.boardsService.listAllBoards(project);

    return data;
  }

  /*
  |--------------------------------------------------------------------------
  | Get My Boards
  |--------------------------------------------------------------------------
  |
  | Endpoint:
  | GET /boards/my-boards?project=<projectId>
  |
  | Purpose:
  | Returns boards related to the logged-in user.
  |
  |--------------------------------------------------------------------------
  */
  @Get('my-boards')
  async listMyBoards(
    @Query('project') project: string,
    @UserDetails() user: any,
  ) {
    // Fetch boards assigned/related to current user
    const data = await this.boardsService.listMyBoards(
      project,
      user?._id,
    );

    return data;
  }

  /*
  |--------------------------------------------------------------------------
  | Get Single Board
  |--------------------------------------------------------------------------
  |
  | Endpoint:
  | GET /boards/:id
  |
  | Purpose:
  | Returns board details using Board ID.
  |
  |--------------------------------------------------------------------------
  */
  @Get(':id')
  async getBoard(@Param('id') id: string) {
    // Find board by ID
    const data = await this.boardsService.getBoardById(id);

    return data;
  }

  /*
  |--------------------------------------------------------------------------
  | Update Board
  |--------------------------------------------------------------------------
  |
  | Endpoint:
  | PUT /boards/:id
  |
  | Purpose:
  | Updates board information and stores updater ID.
  |
  |--------------------------------------------------------------------------
  */
  @Put(':id')
  async updateBoard(
    @Param('id') id: string,
    @Body() updateBoardDto: UpdateBoardDto,
    @UserDetails() user: any,
  ) {
    // Update board and save updater information
    const data = await this.boardsService.updateBoard(id, {
      ...updateBoardDto,
      updatedBy: user?._id,
    });

    return data;
  }

  /*
  |--------------------------------------------------------------------------
  | Delete Board
  |--------------------------------------------------------------------------
  |
  | Endpoint:
  | DELETE /boards/:id
  |
  | Purpose:
  | Deletes a board.
  |
  | Body:
  | {
  |   project: "projectId"
  | }
  |
  |--------------------------------------------------------------------------
  */
  @Delete(':id')
  async deleteBoard(
    @Param('id') id: string,
    @Body() body: { project: string },
  ) {
    // Delete board and update related project if required
    const data = await this.boardsService.deleteBoard(
      id,
      body?.project,
    );

    return data;
  }
}