import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  ForbiddenException,
  NotFoundException,
  UseInterceptors,
  UploadedFile,
  FileTypeValidator,
  ParseFilePipe,
  HttpStatus,
  HttpException,
  BadRequestException,
  Put,
  Inject,
  Query,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { FileCredentialsService } from '../services/file-credentials.service';
// import { CreateFileCredentialDto } from '@lib/dto/dtos/credentials/create-file-credentials.dto';
import { UpdateFileCredentialDto } from '@lib/dto/dtos/credentials/update-file-credentials.dto';
import { AccessGuard } from '@lib/guards';
import {  UserDetails } from '@lib/decorators';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileUploadService } from '@app/file-upload';
import {
  CreateFileCredentialDto,
  SharedWithDto,
} from '@lib/dto/dtos/credentials/create-file-credentials.dto';
import { AUTH_SERVICE, USERS_API_MAPS } from '@lib/common';
import { ClientProxy } from '@nestjs/microservices';
import { ListQueryDTO } from '@lib/dto';
import { RmqService } from '@lib/rmq';
import { RedisService } from 'libs/cache/src';
import { v4 as uuidv4 } from 'uuid';

@ApiTags('File Credentials')
@ApiBearerAuth()
@Controller('file-credentials')
@UseGuards(AccessGuard) // Auth guard and access guard
export class FileCredentialsController {
  constructor(
    @Inject(AUTH_SERVICE) private readonly authClient: ClientProxy,
    private readonly service: FileCredentialsService,
    private readonly fileUploadService: FileUploadService,
    private readonly rmqService: RmqService,
    private readonly redisService: RedisService,
  ) { }

  // @UseInterceptors(FilesInterceptor('files')) // Handle multiple file uploads
  // @ApiConsumes('multipart/form-data')
  @Post('upload')
  @ApiOperation({
    summary: 'Upload multiple files',
    description: 'Uploads multiple files and saves their details.',
  })
  @ApiBody({
    description: 'Multiple file upload body',
    type: CreateFileCredentialDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Pre-signed URLs generated successfully.',
  })
  async uploadFiles(
    @Body() body: CreateFileCredentialDto,
    @UserDetails() user,
  ) {
    const userId = user?._id;

    // Validate sharedWith field
    const sharedWith: SharedWithDto[] = body.sharedWith || [];
    if (body.sharedWith) {
      if (
        !Array.isArray(sharedWith) ||
        !sharedWith.every(
          (obj) =>
            typeof obj.userId === 'string' &&
            typeof obj.accessLevel === 'string' &&
            ['read', 'write'].includes(obj.accessLevel),
        )
      ) {
        throw new BadRequestException('Invalid format for sharedWith');
      }
    }

    // Fetch user record and validate
    const userRecord = await this.authClient
      .send({ cmd: USERS_API_MAPS.GET_USER }, { id: userId })
      .toPromise();
    if (!userRecord) {
      throw new NotFoundException('User not found');
    }

    const allocatedSpace = userRecord.allocatedSpace;



    // Calculate total file size
    // const totalFileSize = body.files.reduce((sum, file) => sum + file.size, 0);

    // if (totalFileSize > allocatedSpace) {
    //   throw new BadRequestException(
    //     'Total file size exceeds the remaining allocated space.',
    //   );
    // }

    // Process each file
    const results = [];
    for (const file of body.files) {
      const fileKey = uuidv4(); // Unique ID for the file
      const key = `${userId}/files/${file.filename}`;

      const signedUrl = await this.fileUploadService.createSignedUrl({
        filename: key,
        type: file.type,
      });

      // Cache file metadata for later validation
      await this.redisService.setInCache(
        fileKey,
        JSON.stringify({
          filename: file.filename,
          key,
          size: file.size,
          sharedWith,
        }),
        1800000,
      );

      results.push({ fileKey, signedUrl });
    }



    return {
      success: true,
      message: 'Pre-signed URLs generated successfully',
      data: results,
      allocatedSpace,
    };
  }

  @Post('/finalize/:fileKey')
  async finalizeFileUpload(
    @Param('fileKey') fileKey: string,
    @UserDetails() user,
  ) {
    // Retrieve cached metadata
    const cachedFile = await this.redisService.getFromCache(fileKey);

    const pasredData = JSON.parse(cachedFile) as {
      filename: string;
      key: string;
      size: number;
      sharedWith: SharedWithDto[];
    };


    if (!cachedFile) {
      throw new BadRequestException('File upload session expired or invalid');
    }

    const { filename, key, size, sharedWith } = pasredData;
    const userId = user?._id;

    // Check if the file exists in S3
    const isUploaded = await this.fileUploadService.verifyFileInS3(key);
    if (!isUploaded) {
      throw new BadRequestException('File not found in S3');
    }

    // Save file details in the database
    const file = await this.service.create(
      {
        filename,
        sharedWith,
        size,
      },
      key,
      userId,
    );

    // Clean up cached metadata
    await this.redisService.destroy(fileKey);

    return {
      success: true,
      message: 'File upload finalized successfully',
      data: file,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all file credentials based on search type' })
  @ApiResponse({
    status: 200,
    description:
      'List of file credentials based on search type, pagination, and optional filters.',
  })
  findAll(
    @UserDetails() user: any, // Fetch user details
    @Query('searchType')
    searchType: 'createdByMe' | 'sharedWithMe' | 'all' = 'createdByMe',
    @Query() queryParams: ListQueryDTO,
  ) {
    const userId = user?._id;
    return this.service.findAllFiles(userId, searchType, queryParams);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a file credential by ID (only if shared with the user)',
  })
  @ApiResponse({
    status: 200,
    description: 'File credential retrieved successfully.',
  })
  @ApiResponse({ status: 403, description: 'Access denied.' })
  @ApiResponse({ status: 404, description: 'File credential not found.' })
  async findOne(@Param('id') id: string, @UserDetails() user) {
    const userId = user?._id;
    const file = await this.service.findOne(userId, id);
    if (!file) throw new NotFoundException('File credential not found');
    return file;
  }

  @Patch('update/:fileId')
  @ApiOperation({
    summary: 'Update a file',
    description: 'Updates file details and shared access information.',
  })
  @ApiParam({
    name: 'fileId',
    type: String,
    description: 'Unique identifier of the file to update',
    example: 'file12345',
  })
  @ApiBody({
    description: 'Update file body',
    type: CreateFileCredentialDto,
  })
  @ApiResponse({
    status: 200,
    description: 'File updated successfully',
    schema: {
      example: {
        success: true,
        message: 'File updated successfully',
        data: {
          id: 'file12345',
          sharedWith: [
            { userId: 'user1', accessLevel: 'read' },
            { userId: 'user2', accessLevel: 'write' },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid JSON format for sharedWith',
  })
  async update(
    @Body() body: UpdateFileCredentialDto,
    @UserDetails() user,
    @Param('fileId') fileId: string,
  ) {




    const result = await this.service.update(fileId, body);

    return {
      success: true,
      message: 'File updated successfully',
      data: result,
    };
  }

  @Put('update-file/:fileId')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Update a file and its sharedWith array' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({
    name: 'fileId',
    description: 'ID of the file to be updated',
    example: '665c123456789abcdef12345',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'New file to replace the existing file (optional)',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'File updated successfully.',
    schema: {
      example: {
        success: true,
        message: 'File updated successfully.',
        data: {
          fileName: 'newfile.pdf',
          fileUrl:
            'https://s3.amazonaws.com/yourbucket/uniq123/files/newfile.pdf',
          sharedWith: ['user3', 'user4'],
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid file update request.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'File not found.',
  })
  async updateFile(
    @Param('fileId') fileId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new FileTypeValidator({ fileType: 'application/*' })],
        fileIsRequired: false, // File is optional
      }),
    )
    file: Express.Multer.File,
    @UserDetails() user: any,
  ) {
    const existingFile = await this.service.findById(fileId);

    if (!existingFile) {
      throw new HttpException('File not found.', HttpStatus.NOT_FOUND);
    }

    let filePath = existingFile.path;

    // Replace file if a new file is uploaded
    if (file) {
      // Delete the old file from S3
      await this.fileUploadService.deleteFile(existingFile.path);

      // Upload the new file to S3
      filePath = `${user?._id}/files/${file.originalname}`;
      await this.fileUploadService.uploadFile(file.buffer, filePath);
    }
    // const userRecord = await this.service.fetchUser(user?._id);
    const userRecord = await this.authClient
      .send(
        { cmd: USERS_API_MAPS.GET_USER },
        {
          id: user?._id,
        },
      )
      .toPromise();

    if (!userRecord) {
      throw new NotFoundException('User not found');
    }
    const val = userRecord.allocatedSpace + existingFile.size;
    const fileSize = file.size;
    await this.service.updateAllocatedSize(
      user?._id,
      fileSize,
      'decrement',
      val,
    );
    // Update database record with new sharedWith array and optional filePath
    const updatedFile = await this.service.updateFile(
      fileId,
      filePath,
      file.originalname,
      file.size,
    );

    return {
      success: true,
      message: 'File updated successfully.',
      data: updatedFile,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a file credential' })
  @ApiResponse({
    status: 200,
    description: 'File credential deleted successfully.',
  })
  @ApiResponse({ status: 403, description: 'Access denied.' })
  async remove(@Param('id') id: string, @UserDetails() user): Promise<any> {
    const userId = user?._id;
    const file = await this.service.findOneCreatedBy(userId, id);
    Logger.log(file);
    if (!file)
      throw new ForbiddenException(
        "Access denied. File doesn't exist.",
      );

    if (file.createdBy.toString() !== userId.toString()) {
      throw new ForbiddenException(
        "Access denied. Not Created By you ",
      );
    }
    await this.service.remove(id);

    const filePath = file.path;
    await this.fileUploadService.deleteFile(filePath);

    return {
      success: true,
      message: 'File deleted successfully.',
      data: file,
    };
  }
}
