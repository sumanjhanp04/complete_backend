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
import { AccountCredentialsService } from '../services/account-credentials.service';
import { CreateAccountCredentialsDto } from '@lib/dto/dtos/credentials/create-account-credential.dto';
import { UserDetails } from '@lib/decorators';
import { AccessGuard } from '@lib/guards';
import { UpdateAccountCredentialsDto } from '@lib/dto/dtos/credentials/update-account-credential.dto';
import { ListQueryDTO } from '@lib/dto';
@ApiTags('Account Credentials')
@ApiBearerAuth()
@Controller('account-credentials')
@UseGuards(AccessGuard)
export class AccountCredentialsController {
  constructor(private readonly accountService: AccountCredentialsService) {}

  @ApiOperation({ summary: 'Create account credentials' })
  @Post()
  create(
    @Body() createDto: CreateAccountCredentialsDto,
    @UserDetails() user: any,
  ) {
    return this.accountService.create(createDto, user?._id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all account credentials' })
  findAll(
    @UserDetails() user: any,
     @Query('searchType')
        searchType: 'createdByMe' | 'sharedWithMe' | 'all' = 'createdByMe',
        @Query() queryParams: ListQueryDTO,
  ) {
    const userId = user?._id;
    return this.accountService.findAll(userId, searchType, queryParams);
  }

  @ApiOperation({ summary: 'Get account credentials by ID' })
  @Get(':id')
  findOne(@UserDetails() user: any, @Param('id') id: string) {
    return this.accountService.findOne(id, user?._id);
  }

  @ApiOperation({ summary: 'Update account credentials by ID' })
  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateAccountCredentialsDto,
    @UserDetails() user: any,
  ) {
    return this.accountService.update(id, updateDto, user?._id);
  }


  @ApiOperation({ summary: 'Delete account credentials by ID' })
  @Delete(':id')
  remove(@Param('id') id: string, @UserDetails() user: any) {
    return this.accountService.remove(id, user?._id);
  }
}
