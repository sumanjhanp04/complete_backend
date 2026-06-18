import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { HasAccess, UserDetails } from '@lib/decorators';
import {
  CreateShiftDto,
  CreateTeamDto,
  ListQueryDTO,
  UpdateShiftDto,
  UpdateTeamDto,
} from '@lib/dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AccessGuard } from '@lib/guards';
import { ShiftService } from '../service/shift.service';
import { UserDocument } from '@lib/database';

@ApiTags('Shift Api')
@Controller('shift')
@UseGuards(AccessGuard)
@ApiBearerAuth()
export class ShiftController {
  constructor(private readonly shiftService: ShiftService) { }

  @Post()
  async create(@Body() dto: CreateShiftDto, @UserDetails() user: any) {
    if (!['Admin', 'Hr'].includes(user?.userId?.role)) {
      return { message: 'Insufficient Permission', success: false };
    }
    return await this.shiftService.create(dto);
  }

  @Get()
  async findAll(@UserDetails() user: any, @Query() query: ListQueryDTO) {
    if (!['Admin', 'Hr'].includes(user?.userId?.role)) {
      return { message: 'Insufficient Permission', success: false };
    }
    return await this.shiftService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @UserDetails() user: any) {
    if (!['Admin', 'Hr'].includes(user?.userId?.role)) {
      return { message: 'Insufficient Permission', success: false };
    }
    return await this.shiftService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateShiftDto,
    @UserDetails() user: any,
  ) {
    if (!['Admin', 'Hr'].includes(user?.userId?.role)) {
      return { message: 'Insufficient Permission', success: false };
    }
    return await this.shiftService.update(id, dto);
  }

  @Put(':id')
  async bulkAssignShift(@Param('id') id: string, @Body() data: { users: string[] }, @UserDetails() user: any) {
    if (!['Admin', 'Hr'].includes(user?.userId?.role)) {
      throw new Error('Insufficient Permission');
    }
    return await this.shiftService.bulkAssignShift(data.users, id);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @UserDetails() user: any) {
    if (!['Admin', 'Hr'].includes(user?.userId?.role)) {
      return { message: 'Insufficient Permission', success: false };
    }
    return await this.shiftService.delete(id);
  }

}
