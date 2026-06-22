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

// DTO for creating credentials
import { CreateCredentialsDto } from '@lib/dto/dtos/credentials/create-credential.dto';

// Service containing all business logic
import { CredentialsService } from '../services/credentials.service';

// Authentication Guard
import { AccessGuard } from '@lib/guards';

// Custom decorator to get logged-in user details
import { UserDetails } from '@lib/decorators';

// DTO for updating credentials
import { UpdateCredentialsDto } from '@lib/dto/dtos/credentials/update-credentials.dto';

// Common DTO for pagination, sorting, filtering
import { ListQueryDTO } from '@lib/dto';

/**
 * Swagger Group Name
 */
@ApiTags('Credentials')

/**
 * Swagger JWT Authentication
 */
@ApiBearerAuth()

/**
 * Base Route
 *
 * All APIs start with:
 * /credentials
 */
@Controller('credentials')

/**
 * Protect all APIs using JWT Authentication
 */
@UseGuards(AccessGuard)
export class CredentialsController {
  /**
   * Dependency Injection
   *
   * Inject CredentialsService
   */
  constructor(
    private readonly credentialsService: CredentialsService,
  ) { }

  /**
   * ==================================================
   * CREATE CREDENTIAL
   * ==================================================
   *
   * POST /credentials
   *
   * Creates a new service credential.
   */
  @Post()
  @ApiOperation({
    summary: 'Create service metadata',
  })
  create(
    @UserDetails() user: any, // Logged-in user
    @Body() createDto: CreateCredentialsDto, // Request body
  ) {
    return this.credentialsService.create(
      createDto,
      user?._id,
    );
  }

  /**
   * ==================================================
   * GET ALL CREDENTIALS
   * ==================================================
   *
   * GET /credentials
   *
   * Search Types:
   * - createdByMe
   * - sharedWithMe
   * - all
   *
   * Supports:
   * - Pagination
   * - Search
   * - Sorting
   */
  @Get()
  @ApiOperation({
    summary: 'Get all services',
  })
  findAll(
    @UserDetails() user: any,

    // Filter data based on ownership/sharing
    @Query('searchType')
    searchType:
      | 'createdByMe'
      | 'sharedWithMe'
      | 'all' = 'createdByMe',

    // Pagination and filtering params
    @Query() queryParams: ListQueryDTO,
  ) {
    const userId = user?._id;

    return this.credentialsService.findAll(
      userId,
      searchType,
      queryParams,
    );
  }

  /**
   * ==================================================
   * GET SINGLE CREDENTIAL
   * ==================================================
   *
   * GET /credentials/:id
   *
   * Returns service metadata along with
   * related account credentials.
   */
  @ApiOperation({
    summary:
      'Get service by ID with related account credentials',
  })
  @Get(':id')
  findOne(
    @UserDetails() user: any,
    @Param('id') id: string,
  ) {
    return this.credentialsService.findOne(
      id,
      user?._id,
    );
  }

  /**
   * ==================================================
   * UPDATE CREDENTIAL
   * ==================================================
   *
   * PUT /credentials/:id
   *
   * Updates service metadata.
   */
  @ApiOperation({
    summary: 'Update service metadata',
  })
  @Put(':id')
  update(
    @Param('id') id: string, // Credential ID
    @UserDetails() user: any, // Logged-in User
    @Body() updateDto: UpdateCredentialsDto, // Updated Data
  ) {
    return this.credentialsService.update(
      id,
      updateDto,
      user?._id,
    );
  }

  /**
   * ==================================================
   * DELETE CREDENTIAL
   * ==================================================
   *
   * DELETE /credentials/:id
   *
   * Removes a credential record.
   */
  @ApiOperation({
    summary: 'Delete service by ID',
  })
  @Delete(':id')
  remove(
    @Param('id') id: string,
    @UserDetails() user: any,
  ) {
    return this.credentialsService.remove(
      id,
      user?._id,
    );
  }
}