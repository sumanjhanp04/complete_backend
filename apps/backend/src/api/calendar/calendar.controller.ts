import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Logger,
} from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { CreateCalendarDto, UpdateCalendarDto } from '@lib/dto';
import { AccessGuard } from '@lib/guards';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { HasAccess, UserDetails } from '@lib/decorators';
import { CALENDAR_EVENT_TYPE, Employee, UserDocument } from '@lib/database';

@ApiTags('CalenderApi')
@Controller('calendar')
@UseGuards(AccessGuard)
@ApiBearerAuth()
export class CalendarController {
  private readonly logger = new Logger(CalendarController.name);

  constructor(private readonly calendarService: CalendarService) { }

  @Post('events')
  @HasAccess()
  create(
    @Body() createCalendarDto: CreateCalendarDto,
    @UserDetails() user: any,
  ) {
    const userId = user?._id?.toString();
    const role = user?.userId?.role;

    this.logger.log({ userId, role })
    return this.calendarService.create(createCalendarDto, userId, role);
  }

  @Get('events')
  @ApiQuery({
    name: 'day',
    required: false,
    description: 'Filter events by specific day (format: YYYY-MM-DD)',
    type: String,
  })
  @ApiQuery({
    name: 'month',
    required: false,
    description: 'Filter events by specific month (format: MM)',
    type: String,
  })
  @ApiQuery({
    name: 'year',
    required: false,
    description: 'Filter events by specific year (format: YYYY)',
    type: String,
  })
  @ApiQuery({
    name: 'type',
    required: false,
    description: 'Filter by events type EVENT | TASK | MEETING',
    type: String,
    enum: CALENDAR_EVENT_TYPE,
  })
  findAll(
    @UserDetails() user: UserDocument,
    @Query() query: { day: string; month: string; year: string; type: string },
  ) {

    try {
      const userId = user?._id?.toString();
      return this.calendarService.findAll(userId, query);
    } catch (error) {
      this.logger.error(error);
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string, @UserDetails() user: UserDocument) {
    const userId = user?._id?.toString();
    return this.calendarService.findOne(id, userId);
  }

  @Patch('events/:id')
  update(
    @Param('id') id: string,
    @Body() updateCalendarDto: UpdateCalendarDto,
    @UserDetails() user: any,
  ) {
    const userId = user?._id?.toString();
    const role = user?.userId?.role;
    return this.calendarService.update(id, updateCalendarDto, userId, role);
  }

  @Delete('events/:id')
  remove(@Param('id') id: string, @UserDetails() user: UserDocument) {
    const userId = user?._id?.toString();
    return this.calendarService.remove(id, userId);
  }
}
