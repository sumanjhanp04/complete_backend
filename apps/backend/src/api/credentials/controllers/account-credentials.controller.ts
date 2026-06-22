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

// Service that contains all business logic
import { AccountCredentialsService } from '../services/account-credentials.service';

// DTO used for creating credentials
import { CreateAccountCredentialsDto } from '@lib/dto/dtos/credentials/create-account-credential.dto';

// Custom decorator to get logged-in user details
import { UserDetails } from '@lib/decorators';

// Authentication guard
import { AccessGuard } from '@lib/guards';

// DTO used for updating credentials
import { UpdateAccountCredentialsDto } from '@lib/dto/dtos/credentials/update-account-credential.dto';

// Common DTO for pagination, sorting, filtering
import { ListQueryDTO } from '@lib/dto';

/**
 * Swagger Group Name
 */
@ApiTags('Account Credentials')

/**
 * Swagger JWT Authentication
 */
@ApiBearerAuth()

/**
 * Base Route
 * All APIs will start with:
 * /account-credentials
 */
@Controller('account-credentials')

/**
 * Protect all routes using AccessGuard
 * User must be logged in
 */
@UseGuards(AccessGuard)
export class AccountCredentialsController {
  /**
   * Dependency Injection
   * Inject AccountCredentialsService
   */
  constructor(
    private readonly accountService: AccountCredentialsService,
  ) { }

  /**
   * --------------------------------------------------
   * CREATE ACCOUNT CREDENTIALS
   * --------------------------------------------------
   * POST /account-credentials
   *
   * Creates a new account credential record.
   */
  @ApiOperation({ summary: 'Create account credentials' })
  @Post()
  create(
    @Body() createDto: CreateAccountCredentialsDto, // Request body data
    @UserDetails() user: any, // Logged-in user details
  ) {
    // Pass DTO and user ID to service
    return this.accountService.create(
      createDto,
      user?._id,
    );
  }

  /**
   * --------------------------------------------------
   * GET ALL ACCOUNT CREDENTIALS
   * --------------------------------------------------
   * GET /account-credentials
   *
   * Supports:
   * - createdByMe
   * - sharedWithMe
   * - all
   *
   * Also supports pagination, search, sorting etc.
   */
  @Get()
  @ApiOperation({ summary: 'Get all account credentials' })
  findAll(
    @UserDetails() user: any,

    // Filter type
    @Query('searchType')
    searchType:
      | 'createdByMe'
      | 'sharedWithMe'
      | 'all' = 'createdByMe',

    // Pagination & query parameters
    @Query() queryParams: ListQueryDTO,
  ) {
    const userId = user?._id;

    // Fetch credentials based on selected filter
    return this.accountService.findAll(
      userId,
      searchType,
      queryParams,
    );
  }

  /**
   * --------------------------------------------------
   * GET SINGLE ACCOUNT CREDENTIAL
   * --------------------------------------------------
   * GET /account-credentials/:id
   *
   * Fetch one credential by ID.
   */
  @ApiOperation({
    summary: 'Get account credentials by ID',
  })
  @Get(':id')
  findOne(
    @UserDetails() user: any,
    @Param('id') id: string,
  ) {
    return this.accountService.findOne(
      id,
      user?._id,
    );
  }

  /**
   * --------------------------------------------------
   * UPDATE ACCOUNT CREDENTIAL
   * --------------------------------------------------
   * PUT /account-credentials/:id
   *
   * Update credential details.
   */
  @ApiOperation({
    summary: 'Update account credentials by ID',
  })
  @Put(':id')
  update(
    @Param('id') id: string, // Credential ID
    @Body() updateDto: UpdateAccountCredentialsDto, // Updated data
    @UserDetails() user: any, // Logged-in user
  ) {
    return this.accountService.update(
      id,
      updateDto,
      user?._id,
    );
  }

  /**
   * --------------------------------------------------
   * DELETE ACCOUNT CREDENTIAL
   * --------------------------------------------------
   * DELETE /account-credentials/:id
   *
   * Remove credential by ID.
   */
  @ApiOperation({
    summary: 'Delete account credentials by ID',
  })
  @Delete(':id')
  remove(
    @Param('id') id: string,
    @UserDetails() user: any,
  ) {
    return this.accountService.remove(
      id,
      user?._id,
    );
  }
}