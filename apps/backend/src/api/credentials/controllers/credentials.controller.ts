import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Query,
  Put,
} from '@nestjs/common';

import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CreateCredentialsDto } from '@lib/dto/dtos/credentials/create-credential.dto';
import { CredentialsService } from '../services/credentials.service';
import { AccessGuard } from '@lib/guards';
import { UserDetails } from '@lib/decorators';
import { UpdateCredentialsDto } from '@lib/dto/dtos/credentials/update-credentials.dto';
import { ListQueryDTO } from '@lib/dto';

@ApiTags('Credentials')
@ApiBearerAuth()
@Controller('credentials')
@UseGuards(AccessGuard)
export class CredentialsController {
  constructor(private readonly credentialsService: CredentialsService) {}

  @Post()
  @ApiOperation({ summary: 'Create service metadata' })
  create(@UserDetails() user: any, @Body() createDto: CreateCredentialsDto) {
    return this.credentialsService.create(createDto, user?._id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all services' })
  findAll(
    @UserDetails() user: any,
    @Query('searchType')
    searchType: 'createdByMe' | 'sharedWithMe' | 'all' = 'createdByMe',
    @Query() queryParams: ListQueryDTO,
  ) {
    const userId = user?._id;
    return this.credentialsService.findAll(userId, searchType, queryParams);
  }

  @ApiOperation({
    summary: 'Get service by ID with related account credentials',
  })
  @Get(':id')
  findOne(@UserDetails() user: any, @Param('id') id: string) {
    return this.credentialsService.findOne(id, user?._id);
  }

  @ApiOperation({ summary: 'Update service metadata' })
  @Put(':id')
  update(
    @Param('id') id: string,
    @UserDetails() user: any,
    @Body() updateDto: UpdateCredentialsDto,
  ) {
    return this.credentialsService.update(id, updateDto, user?._id);
  }

  @ApiOperation({ summary: 'Delete service by ID' })
  @Delete(':id')
  remove(@Param('id') id: string, @UserDetails() user: any) {
    return this.credentialsService.remove(id, user?._id);
  }
}
