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

@ApiTags('BoardsApi')
@UseGuards(AccessGuard)
@Controller('boards')
@ApiBearerAuth()
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  @Post()
  async createBoard(@Body() body: CreateBoardDto, @UserDetails() user: any) {
    const data = await this.boardsService.createBoard({
      ...body,
      createdBy: user?._id,
    });
    return data;
  }

  @Get()
  @HasAccess()
  async listAllBoards(
    @Query('project') project: string,
  ) {
    const data = await this.boardsService.listAllBoards(project);
    return data;
  }

  @Get('my-boards')
  async listMyBoards(
    @Query('project') project: string,
    @UserDetails() user: any,
  ) {
    const data = await this.boardsService.listMyBoards(project, user?._id);
    return data;
  }

  @Get(':id')
  async getBoard(@Param('id') id: string) {
    // const data = await this.boardsClient.send({ cmd: BOARDS_API_MAPS.GET_BOARD }, id).toPromise();
    const data = await this.boardsService.getBoardById(id);
    return data;
  }

  @Put(':id')
  async updateBoard(
    @Param('id') id: string,
    @Body() updateBoardDto: UpdateBoardDto,
    @UserDetails() user: any,
  ) {
    // const data = await this.boardsClient.send({ cmd: BOARDS_API_MAPS.UPDATE_BOARD }, { updateBoardDto: { ...updateBoardDto, updatedBy: token?.user?._id }, id }).toPromise();
    const data = await this.boardsService.updateBoard(id, {
      ...updateBoardDto,
      updatedBy: user?._id,
    });
    return data;
  }

  @Delete(':id')
  async deleteBoard(
    @Param('id') id: string,
    @Body() body: { project: string },
  ) {
    // const data = await this.boardsClient.send({ cmd: BOARDS_API_MAPS.DELETE_BOARD }, { id, project: body.project }).toPromise();
    const data = await this.boardsService.deleteBoard(id, body?.project);
    return data;
  }
}
