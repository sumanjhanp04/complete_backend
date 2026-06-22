import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Logger,
  Param,
  ParseFilePipe,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  FileTypeValidator,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { HasAccess, UserDetails } from '@lib/decorators';
import { EMPLOYEE_TYPE_MAP } from '@lib/database';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiTags,
} from '@nestjs/swagger';
import { AccessGuard } from '@lib/guards';
import {
  CreateChatFileCredentialDto,
} from '@lib/dto/dtos/chat/chat.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileUploadService } from '@app/file-upload';
import {
  generateRandomString,
  calculateProcessingTime,
} from '@lib/common';
import { v4 as uuidv4 } from 'uuid';
import { RedisService } from '@app/cache/cache.service';
import { FileCredentialsService } from '../../api/credentials/services/file-credentials.service';

/**
 * ----------------------------------------------------------------------------
 * Chat Controller
 * ----------------------------------------------------------------------------
 * Handles:
 * - Conversations
 * - Messages
 * - User listing
 * - Group profile uploads
 * - Chat file uploads (S3 Pre-signed URLs)
 * - File upload finalization
 * ----------------------------------------------------------------------------
 */
@ApiTags('Chats')
@UseGuards(AccessGuard)
@Controller('chat')
@ApiBearerAuth()
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(
    private readonly service: FileCredentialsService,
    private readonly fileUploadService: FileUploadService,
    private readonly chatService: ChatService,
    private readonly redisService: RedisService,
  ) { }

  /**
   * --------------------------------------------------------------------------
   * Get All Conversations
   * --------------------------------------------------------------------------
   * Returns all chat conversations for the logged-in user.
   *
   * Endpoint:
   * GET /chat/all-conversations
   * --------------------------------------------------------------------------
   */
  @Get('all-conversations')
  @HasAccess(
    EMPLOYEE_TYPE_MAP.EMPLOYEE,
    EMPLOYEE_TYPE_MAP.ADMIN,
    EMPLOYEE_TYPE_MAP.HR,
  )
  async allConversation(@UserDetails() user: any) {
    return await this.chatService.allConversation(
      user._id.toString(),
    );
  }

  /**
   * --------------------------------------------------------------------------
   * Get All Messages of a Room
   * --------------------------------------------------------------------------
   * Returns complete chat history for a room.
   *
   * Endpoint:
   * GET /chat/all-messages/:roomId
   * --------------------------------------------------------------------------
   */
  @Get('all-messages/:roomId')
  @HasAccess(
    EMPLOYEE_TYPE_MAP.EMPLOYEE,
    EMPLOYEE_TYPE_MAP.ADMIN,
    EMPLOYEE_TYPE_MAP.HR,
  )
  async allMessages(@Param('roomId') id: string) {
    return await this.chatService.allMessages(id);
  }

  /**
   * --------------------------------------------------------------------------
   * Get User List
   * --------------------------------------------------------------------------
   * Returns all users except current user.
   * Usually used while creating chats/groups.
   *
   * Endpoint:
   * GET /chat/users-list
   * --------------------------------------------------------------------------
   */
  @Get('users-list')
  async getUserList(@UserDetails() user: any) {
    const prm = {
      _id: { $ne: user?._id },
    };

    const attn = {
      role: user?.role,
    };

    return await this.chatService.listUser(prm, attn);
  }

  /**
   * --------------------------------------------------------------------------
   * Upload Group Profile Image
   * --------------------------------------------------------------------------
   * Uploads or replaces a group chat profile image.
   *
   * Steps:
   * 1. Validate image file
   * 2. Get room details
   * 3. Delete old image if exists
   * 4. Upload new image to S3
   * 5. Update room profile photo
   *
   * Endpoint:
   * POST /chat/upload-group-profile
   * --------------------------------------------------------------------------
   */
  @Post('upload-group-profile')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Group chat image',
        },
        roomId: {
          type: 'string',
          description: 'Room ID',
        },
      },
    },
  })
  async uploadGroupProfile(
    @Body() roomId: { roomId: string },

    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({
            fileType: 'image/*',
          }),
        ],
      }),
    )
    file: Express.Multer.File,

    @UserDetails() user: any,
  ) {
    const {
      success,
      data: roomDetail,
    } = await this.chatService.getRoomDetail(roomId?.roomId);

    if (!success) {
      return {
        success: false,
        message: 'Something went wrong',
      };
    }

    // Delete existing group image
    if (roomDetail?.basicDetails?.groupProfile) {
      await this.fileUploadService.deleteFile(
        roomDetail.basicDetails.groupProfile,
      );
    }

    // Generate unique file name
    let fileName = `${generateRandomString(20)}.${file.mimetype.split('/')[1]
      }`;

    fileName = `${user?.userId?._id}/groupPhoto/${fileName}`;

    // Upload image to S3
    await this.fileUploadService.uploadFile(
      file.buffer,
      fileName,
    );

    // Update group profile photo in DB
    return await this.chatService.updateRoomProfilePhoto(
      roomId.roomId,
      fileName,
    );
  }

  /**
   * --------------------------------------------------------------------------
   * Generate Pre-Signed URLs For Chat Files
   * --------------------------------------------------------------------------
   * Used for large file uploads.
   *
   * Steps:
   * 1. Generate file key
   * 2. Create S3 signed URL
   * 3. Cache metadata in Redis
   * 4. Return signed URL
   *
   * Endpoint:
   * POST /chat/upload-file
   * --------------------------------------------------------------------------
   */
  @Post('upload-file')
  async uploadDocuments(
    @Body() body: CreateChatFileCredentialDto,
    @UserDetails() user: any,
  ) {
    const roomId = body.id;
    const results = [];

    await Promise.all(
      body?.files?.map(async (file) => {
        try {
          // Unique upload session key
          const fileKey = uuidv4();

          // S3 storage path
          const key = `${roomId}/files/${file.filename}${Date.now()}`;

          // Generate pre-signed URL
          const signedUrl =
            await this.fileUploadService.createSignedUrl({
              filename: key,
              type: file.type,
            });

          // Cache expiry based on file size
          const cacheTime = calculateProcessingTime(
            file.size,
          );

          // Store metadata in Redis
          await this.redisService.setInCache(
            fileKey,
            JSON.stringify({
              filename: file.filename,
              key,
              size: file.size,
            }),
            cacheTime,
          );

          results.push({
            fileKey,
            signedUrl,
          });
        } catch (err) {
          throw new BadRequestException(
            err.message ??
            'Something went wrong while generating signed URL',
          );
        }
      }),
    );

    return {
      success: true,
      message: 'Pre-signed URLs generated successfully',
      data: results,
    };
  }

  /**
   * --------------------------------------------------------------------------
   * Finalize File Upload
   * --------------------------------------------------------------------------
   * Called after frontend uploads file to S3.
   *
   * Steps:
   * 1. Read metadata from Redis
   * 2. Verify file exists in S3
   * 3. Remove Redis cache
   * 4. Return file key
   *
   * Endpoint:
   * POST /chat/finalize/:fileKey
   * --------------------------------------------------------------------------
   */
  @Post('/finalize/:fileKey')
  async finalizeFileUpload(
    @Param('fileKey') fileKey: string,
    @UserDetails() user,
  ) {
    // Get upload session data from Redis
    const cachedFile =
      await this.redisService.getFromCache(fileKey);

    if (!cachedFile) {
      throw new BadRequestException(
        'File upload session expired or invalid',
      );
    }

    const parsedData = JSON.parse(cachedFile) as {
      filename: string;
      key: string;
      size: number;
    };

    const { key } = parsedData;

    // Verify file actually uploaded to S3
    const isUploaded =
      await this.fileUploadService.verifyFileInS3(key);

    if (!isUploaded) {
      throw new BadRequestException(
        'File not found in S3',
      );
    }

    // Remove cached upload metadata
    await this.redisService.destroy(fileKey);

    return {
      success: true,
      message: 'File upload finalized successfully',
      key,
    };
  }
}