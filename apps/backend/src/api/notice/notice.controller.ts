import { NoticeService } from './notice.service';
import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  // UseInterceptors,
  UseGuards,
  // UploadedFiles,
  BadRequestException,
  Query,
  NotFoundException,
  Delete,
  Put,
  Logger,
} from '@nestjs/common';

import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';

import { AccessGuard } from '@lib/guards';
import { v4 as uuidv4 } from 'uuid';
import { HasAccess, UserDetails } from '@lib/decorators';
import { FileUploadService } from '@app/file-upload';
import { RedisService } from '@app/cache/cache.service';
import { ListQueryDTO } from '@lib/dto';
import { CreateNoticeDto, UpdateNoticeDto } from '@lib/dto/dtos/notice/notice.dto';

@ApiBearerAuth()
@Controller('notices')
@UseGuards(AccessGuard)
@ApiTags('Notices') // This groups the endpoints under the "Files" section in Swagger
export class NoticeController {
  private logger = new Logger(NoticeController.name);

  constructor(
    private readonly noticeService: NoticeService,
    private readonly fileUploadService: FileUploadService,
    private readonly redisService: RedisService,
  ) { }

  // > FileController (first two routes)

  @Post()
  @HasAccess()
  @ApiOperation({ summary: 'Upload a new file' })
  @ApiBody({
    description: 'Upload multiple file along with metadata',
    type: CreateNoticeDto,
  })
  async createFile(
    @Body() createNoticeDto: CreateNoticeDto,

  ) {



    const {
      title,
      description,
      files,
      department,
      shift,
      employeeId,
      expiryDate,
    } = createNoticeDto;



    // Process each file
    const results = [];
    for (const file of files) {
      // Generate a unique ID for the file
      const fileKey = uuidv4();
      const key = `announcements/${new Date().getFullYear()}/${new Date().getMonth().toString().padStart(2, '0')}/${file.filename}`;

      // Create a signed URL for the file
      const signedUrl = await this.fileUploadService.createSignedUrl({
        filename: key,
        type: file.type, // Use the type from the metadata
      });

      // Cache file metadata for later validation
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
      this.logger.log('KEY:', key);
      results.push({ fileKey, signedUrl });
    }

    this.logger.log('results', results);

    return {
      success: true,
      message: 'Pre-signed URLs generated successfully',
      data: results,
    };
  }

  @Post('/finalize/:fileKey')
  async finalizeFileUpload(@Param('fileKey') fileKey: string) {
    // Retrieve cached metadata
    const cachedFile = await this.redisService.getFromCache(fileKey);

    if (!cachedFile) {
      throw new BadRequestException('File upload session expired or invalid');
    }

    const pasredData = JSON.parse(cachedFile) as {
      createNoticeDto: Omit<CreateNoticeDto, 'files'>;
      filename: string;
      key: string;
    };

    const { createNoticeDto, filename, key } = pasredData;

    // Check if the file exists in S3
    // const isUploaded = await this.fileUploadService.verifyFileInS3(key);
    // if (!isUploaded) {
    //   throw new BadRequestException('File not found in S3');
    // }

    // Save file details in the database
    const file = await this.noticeService.createNotice({
      createNoticeDto,
      filename,
      path: key,
    });

    // Clean up cached metadata
    await this.redisService.destroy(fileKey);

    return {
      success: true,
      message: 'File upload finalized successfully',
      data: file,
    };
  }

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
    @Query() query: { department?: string[], shift?: string[], employeeId?: string[] } & ListQueryDTO,
  ) {
    const { department, shift, employeeId } = query;

    const searchType = { department, shift, employeeId };

    return this.noticeService.findAll(user, searchType, query);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a file by ID' })
  async updateNotice(
    @Param('id') noticeId: string,
    @Body() updateNoticeDto: UpdateNoticeDto,
    @UserDetails() user: any,
  ) {
    const existingNotice = await this.noticeService.findById(noticeId);

    if (!existingNotice) {
      throw new NotFoundException('Notice not found');
    }

    // Authorization check
    if (
      !['Admin', 'Hr'].includes(user.userId.role) &&
      user.userId.isManager === false
    ) {
      throw new BadRequestException(
        'You are not authorized to update this file',
      );
    }



    const updatedFile = await this.noticeService.updateNotice(
      noticeId,
      updateNoticeDto,
    );
    return {
      success: true,
      message: 'Notice updated successfully',
      data: updatedFile,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a file by ID' })
  async deleteFile(@Param('id') fileId: string, @UserDetails() user: any) {
    const existingFile = await this.noticeService.findById(fileId);

    if (!existingFile) {
      throw new NotFoundException('File not found');
    }

    // Authorization check
    if (
      !['Admin', 'Hr'].includes(user.userId.role) &&
      user.userId.isManager === false
    ) {
      throw new BadRequestException(
        'You are not authorized to update this file',
      );
    }

    // Delete the file from storage and database
    await this.noticeService.deleteNotice(fileId, existingFile.filePath);

    return {
      success: true,
      message: 'File deleted successfully',
    };
  }
}
