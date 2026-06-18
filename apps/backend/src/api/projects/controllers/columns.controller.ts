import { CreateColumnDto, DeleteColumnDto, UpdateColumnDto } from '@lib/dto'; // Make sure you have DTOs for columns
import {
  Body,
  Controller,
  Get,
  Inject,
  Logger,
  Post,
  Put,
  Delete,
  Param,
  Res,
} from '@nestjs/common';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ColumnsService } from '../services/column.service';
import { UserDetails } from '@lib/decorators';

@ApiTags('ColumnsApi')
@Controller('board-column')
@ApiBearerAuth()
export class ColumnsController {
  private logger = new Logger(ColumnsController.name);

  constructor(private readonly columsService: ColumnsService) {}

  @Post(':board')
  async createColumn(
    @Param('board') board: string,
    @Body() body: CreateColumnDto,
    @UserDetails() user: any,
  ) {
    const data = await this.columsService.createColumn(
      { ...body, createdBy: user?._id },
      board,
    );
    return data;
  }

  @Get(':id')
  async getColumn(@Param('id') id: string, @UserDetails() user: any) {
    const data = await this.columsService.getColumnById(id);
    return data;
  }

  @Put(':id')
  async updateColumn(
    @Param('id') id: string,
    @Body() body: UpdateColumnDto,
    @UserDetails() user: any,
  ) {
    const data = await this.columsService.updateColumn(id, {
      ...body,
      updatedBy: user?._id,
      
    },{colTo:body.colTo,colFrom:body.colFrom,task:body.task});
    return data;
  }

  @Delete(':id')
  async deleteColumn(
    @Param('id') id: string,
    @Body() body: DeleteColumnDto,
    @UserDetails() user: any,
  ) {
    const data = await this.columsService.deleteColumn(id, body.board);
    return data;
  }
}
