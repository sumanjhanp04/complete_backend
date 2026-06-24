// Service layer containing all business logic for Notice module
import { NoticeService } from './notice.service';

// NestJS decorators and exceptions
import {
  Body, // Gets data sent in request body (POST, PUT)
  Controller, // Marks class as a controller
  Get, // Handles HTTP GET requests
  Post, // Handles HTTP POST requests
  Param, // Gets route parameters (e.g. /notice/:id)
  UseGuards, // Applies authentication/authorization guards
  BadRequestException, // Throws 400 Bad Request error
  Query, // Gets query parameters (?page=1)
  NotFoundException, // Throws 404 Not Found error
  Delete, // Handles HTTP DELETE requests
  Put, // Handles HTTP PUT requests
  Logger, // Used for logging messages and errors
} from '@nestjs/common';

// Swagger decorators used for API documentation
import {
  ApiTags, // Groups APIs in Swagger UI
  ApiOperation, // Adds description to an API endpoint
  ApiBody, // Documents request body structure
  ApiBearerAuth, // Indicates JWT/Bearer token authentication
  ApiQuery, // Documents query parameters
} from '@nestjs/swagger';

// Custom authentication/authorization guard
import { AccessGuard } from '@lib/guards';

// Generates unique IDs
import { v4 as uuidv4 } from 'uuid';

// Custom decorators
import { HasAccess, UserDetails } from '@lib/decorators';
// HasAccess -> Checks permissions/roles
// UserDetails -> Gets logged-in user information

// Service used for uploading files (images, documents, etc.)
import { FileUploadService } from '@app/file-upload';

// Redis service used for caching data
import { RedisService } from '@app/cache/cache.service';

// Common DTO for pagination, filtering, searching
import { ListQueryDTO } from '@lib/dto';

// DTOs for Notice module
import {
  CreateNoticeDto, // Validates data when creating a notice
  UpdateNoticeDto, // Validates data when updating a notice
} from '@lib/dto/dtos/notice/notice.dto';

/**
 * ============================================================================
 * Notice Controller
 * ============================================================================
 *
 * Responsibilities:
 * - Generate AWS S3 Pre-Signed URLs
 * - Store temporary upload metadata in Redis
 * - Finalize uploads and save notice records
 * - Retrieve notices
 * - Update notices
 * - Delete notices
 *
 * Security:
 * - Protected by AccessGuard
 * - Requires JWT Authentication
 *
 * Route:
 * /notices
 * ============================================================================
 */

@ApiBearerAuth()
@Controller('notices')
@UseGuards(AccessGuard)
@ApiTags('Notices')
export class NoticeController {
  private logger = new Logger(NoticeController.name);

  constructor(
    private readonly noticeService: NoticeService,
    private readonly fileUploadService: FileUploadService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * ==========================================================================
   * Create Notice Upload Session
   * ==========================================================================
   *
   * Endpoint:
   * POST /notices
   *
   * Purpose:
   * - Generates AWS S3 Pre-Signed URLs
   * - Stores upload metadata in Redis
   * - Returns upload URL and file key
   *
   * Flow:
   * Client
   *   ↓
   * NoticeController
   *   ↓
   * Generate Signed URL
   *   ↓
   * Save Metadata in Redis
   *   ↓
   * Return Signed URL
   * ==========================================================================
   */
  @Post()
  @HasAccess()
  @ApiOperation({ summary: 'Upload a new file' })
  @ApiBody({
    description: 'Upload multiple files along with metadata',
    type: CreateNoticeDto,
  })
  async createFile(@Body() createNoticeDto: CreateNoticeDto) {
    const {
      title,
      description,
      files,
      department,
      shift,
      employeeId,
      expiryDate,
    } = createNoticeDto;

    const results = [];

    /**
     * Process each file separately
     */
    for (const file of files) {
      /**
       * Generate unique Redis cache key
       */
      const fileKey = uuidv4();

      /**
       * S3 Storage Path
       *
       * Example:
       * announcements/2026/05/document.pdf
       */
      const key = `announcements/${new Date().getFullYear()}/${new Date()
        .getMonth()
        .toString()
        .padStart(2, '0')}/${file.filename}`;

      /**
       * Generate AWS S3 Signed Upload URL
       */
      const signedUrl = await this.fileUploadService.createSignedUrl({
        filename: key,
        type: file.type,
      });

      /**
       * Store upload metadata temporarily in Redis
       *
       * Expiry:
       * 30 Minutes
       */
      await this.redisService.setInCache(
        fileKey,
        JSON.stringify({
          filename: file.filename,
          createNoticeDto: {
            title,
            description,
            shift,
            department,
            employeeId,
            expiryDate,
          },
          key,
        }),
        1800000,
      );

      this.logger.log(`Generated Upload Path: ${key}`);

      results.push({
        fileKey,
        signedUrl,
      });
    }

    this.logger.log('Generated Upload URLs', results);

    return {
      success: true,
      message: 'Pre-signed URLs generated successfully',
      data: results,
    };
  }

  /**
   * ==========================================================================
   * Finalize File Upload
   * ==========================================================================
   *
   * Endpoint:
   * POST /notices/finalize/:fileKey
   *
   * Purpose:
   * - Validate upload session
   * - Read metadata from Redis
   * - Save notice record in database
   * - Remove Redis cache
   *
   * Flow:
   * Redis
   *   ↓
   * Validate Session
   *   ↓
   * Create Notice Record
   *   ↓
   * Remove Cache
   *   ↓
   * Return Notice
   * ==========================================================================
   */
  @Post('/finalize/:fileKey')
  async finalizeFileUpload(@Param('fileKey') fileKey: string) {
    /**
     * Fetch cached upload metadata
     */
    const cachedFile = await this.redisService.getFromCache(fileKey);

    if (!cachedFile) {
      throw new BadRequestException('File upload session expired or invalid');
    }

    const parsedData = JSON.parse(cachedFile) as {
      createNoticeDto: Omit<CreateNoticeDto, 'files'>;
      filename: string;
      key: string;
    };

    const { createNoticeDto, filename, key } = parsedData;

    /**
     * Optional:
     * Verify file exists in S3 before saving
     */

    // const isUploaded =
    //   await this.fileUploadService.verifyFileInS3(key);

    // if (!isUploaded) {
    //   throw new BadRequestException('File not found in S3');
    // }

    /**
     * Create Notice Record in Database
     */
    const file = await this.noticeService.createNotice({
      createNoticeDto,
      filename,
      path: key,
    });

    /**
     * Remove temporary Redis cache
     */
    await this.redisService.destroy(fileKey);

    return {
      success: true,
      message: 'File upload finalized successfully',
      data: file,
    };
  }

  /**
   * ==========================================================================
   * Get All Notices
   * ==========================================================================
   *
   * Endpoint:
   * GET /notices
   *
   * Supports:
   * - department filtering
   * - shift filtering
   * - employee filtering
   * - pagination
   * - sorting
   * - keyword search
   * ==========================================================================
   */
  @Get()
  @ApiQuery({
    name: 'department',
    required: false,
    isArray: true,
    type: String,
  })
  @ApiQuery({
    name: 'shift',
    required: false,
    isArray: true,
    type: String,
  })
  @ApiQuery({
    name: 'employeeId',
    required: false,
    isArray: true,
    type: String,
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sort', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'keyword', required: false, type: String })
  async findAll(
    @UserDetails() user: any,
    @Query()
    query: {
      department?: string[];
      shift?: string[];
      employeeId?: string[];
    } & ListQueryDTO,
  ) {
    const { department, shift, employeeId } = query;

    const searchType = {
      department,
      shift,
      employeeId,
    };

    return this.noticeService.findAll(user, searchType, query);
  }

  /**
   * ==========================================================================
   * Update Notice
   * ==========================================================================
   *
   * Endpoint:
   * PUT /notices/:id
   *
   * Authorization:
   * - Admin
   * - HR
   * - Manager
   * ==========================================================================
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update notice by ID' })
  async updateNotice(
    @Param('id') noticeId: string,
    @Body() updateNoticeDto: UpdateNoticeDto,
    @UserDetails() user: any,
  ) {
    const existingNotice = await this.noticeService.findById(noticeId);

    if (!existingNotice) {
      throw new NotFoundException('Notice not found');
    }

    /**
     * Authorization Check
     */
    if (
      !['Admin', 'Hr'].includes(user.userId.role) &&
      user.userId.isManager === false
    ) {
      throw new BadRequestException(
        'You are not authorized to update this notice',
      );
    }

    const updatedNotice = await this.noticeService.updateNotice(
      noticeId,
      updateNoticeDto,
    );

    return {
      success: true,
      message: 'Notice updated successfully',
      data: updatedNotice,
    };
  }

  /**
   * ==========================================================================
   * Delete Notice
   * ==========================================================================
   *
   * Endpoint:
   * DELETE /notices/:id
   *
   * Authorization:
   * - Admin
   * - HR
   * - Manager
   *
   * Flow:
   * Validate Notice
   *   ↓
   * Authorization Check
   *   ↓
   * Delete S3 File
   *   ↓
   * Delete DB Record
   * ==========================================================================
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete notice by ID' })
  async deleteFile(@Param('id') fileId: string, @UserDetails() user: any) {
    const existingFile = await this.noticeService.findById(fileId);

    if (!existingFile) {
      throw new NotFoundException('File not found');
    }

    /**
     * Authorization Check
     */
    if (
      !['Admin', 'Hr'].includes(user.userId.role) &&
      user.userId.isManager === false
    ) {
      throw new BadRequestException(
        'You are not authorized to delete this notice',
      );
    }

    /**
     * Delete file from S3 and Database
     */
    await this.noticeService.deleteNotice(fileId, existingFile.filePath);

    return {
      success: true,
      message: 'Notice deleted successfully',
    };
  }
}
