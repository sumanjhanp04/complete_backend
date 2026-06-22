import { CreateColumnDto, DeleteColumnDto, UpdateColumnDto } from '@lib/dto';
import {
  Body,
  Controller,
  Get,
  Logger,
  Post,
  Put,
  Delete,
  Param,
} from '@nestjs/common';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ColumnsService } from '../services/column.service';
import { UserDetails } from '@lib/decorators';

/*
|--------------------------------------------------------------------------
| Columns Controller
|--------------------------------------------------------------------------
|
| This controller manages Board Columns.
|
| Responsibilities:
| - Create Column
| - Get Column Details
| - Update Column
| - Delete Column
|
| Controller -> Service -> Database
|
|--------------------------------------------------------------------------
*/

@ApiTags('ColumnsApi') // Swagger API Group Name
@Controller('board-column') // Base Route => /board-column
@ApiBearerAuth() // Enables JWT Authentication in Swagger
export class ColumnsController {
  /*
  |--------------------------------------------------------------------------
  | Logger
  |--------------------------------------------------------------------------
  |
  | Used for application logging and debugging.
  |
  |--------------------------------------------------------------------------
  */
  private logger = new Logger(ColumnsController.name);

  /*
  |--------------------------------------------------------------------------
  | Dependency Injection
  |--------------------------------------------------------------------------
  |
  | Inject ColumnsService for business logic.
  |
  |--------------------------------------------------------------------------
  */
  constructor(
    private readonly columsService: ColumnsService,
  ) { }

  /*
  |--------------------------------------------------------------------------
  | Create Column
  |--------------------------------------------------------------------------
  |
  | Endpoint:
  | POST /board-column/:board
  |
  | Example:
  | POST /board-column/685abc123
  |
  | Purpose:
  | Creates a new column inside a board.
  |
  |--------------------------------------------------------------------------
  */
  @Post(':board')
  async createColumn(
    @Param('board') board: string,
    @Body() body: CreateColumnDto,
    @UserDetails() user: any,
  ) {
    // Create column and store creator information
    const data = await this.columsService.createColumn(
      {
        ...body,
        createdBy: user?._id,
      },
      board,
    );

    return data;
  }

  /*
  |--------------------------------------------------------------------------
  | Get Single Column
  |--------------------------------------------------------------------------
  |
  | Endpoint:
  | GET /board-column/:id
  |
  | Example:
  | GET /board-column/685xyz123
  |
  | Purpose:
  | Fetch column details by column ID.
  |
  |--------------------------------------------------------------------------
  */
  @Get(':id')
  async getColumn(
    @Param('id') id: string,
    @UserDetails() user: any,
  ) {
    // Retrieve column information
    const data = await this.columsService.getColumnById(id);

    return data;
  }

  /*
  |--------------------------------------------------------------------------
  | Update Column
  |--------------------------------------------------------------------------
  |
  | Endpoint:
  | PUT /board-column/:id
  |
  | Purpose:
  | Updates column information.
  |
  | Also handles:
  | - Column movement
  | - Task movement between columns
  | - Column ordering changes
  |
  |--------------------------------------------------------------------------
  */
  @Put(':id')
  async updateColumn(
    @Param('id') id: string,
    @Body() body: UpdateColumnDto,
    @UserDetails() user: any,
  ) {
    /*
    |--------------------------------------------------------------------------
    | Update Column Data
    |--------------------------------------------------------------------------
    |
    | updatedBy -> Stores user who modified the column.
    |
    |--------------------------------------------------------------------------
    */

    const data = await this.columsService.updateColumn(
      id,
      {
        ...body,
        updatedBy: user?._id,
      },
      {
        // Source column ID
        colFrom: body.colFrom,

        // Destination column ID
        colTo: body.colTo,

        // Task being moved
        task: body.task,
      },
    );

    return data;
  }

  /*
  |--------------------------------------------------------------------------
  | Delete Column
  |--------------------------------------------------------------------------
  |
  | Endpoint:
  | DELETE /board-column/:id
  |
  | Purpose:
  | Deletes a column from a board.
  |
  | Request Body:
  | {
  |   "board": "boardId"
  | }
  |
  |--------------------------------------------------------------------------
  */
  @Delete(':id')
  async deleteColumn(
    @Param('id') id: string,
    @Body() body: DeleteColumnDto,
    @UserDetails() user: any,
  ) {
    // Delete column and update board references
    const data = await this.columsService.deleteColumn(
      id,
      body.board,
    );

    return data;
  }
}