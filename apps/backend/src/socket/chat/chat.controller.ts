import { BadRequestException, Body, Controller, FileTypeValidator, FileValidator, Get, Logger, Param, ParseFilePipe, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { ChatService } from './chat.service';
import { HasAccess, UserDetails } from '@lib/decorators';
import { EMPLOYEE_TYPE_MAP } from '@lib/database';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { AccessGuard } from '@lib/guards';
import { ChatDto, CreateChatFileCredentialDto, roomIdDto } from '@lib/dto/dtos/chat/chat.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileUploadService } from '@app/file-upload';
import { generateRandomString, findFieldName, calculateProcessingTime } from '@lib/common';
import { v4 as uuidv4 } from 'uuid';
import { RedisService } from '@app/cache/cache.service';
import { FileCredentialsService } from '../../api/credentials/services/file-credentials.service';

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
     private readonly redisService:RedisService,
  ) {}

  @Get('all-conversations')
  @HasAccess(EMPLOYEE_TYPE_MAP.EMPLOYEE,EMPLOYEE_TYPE_MAP.ADMIN,EMPLOYEE_TYPE_MAP.HR)
  async allConversation(@UserDetails() user: any) {
    const data = await this.chatService.allConversation(user._id.toString());
    return data;
  }

  @Get('all-messages/:roomId')
  @HasAccess(EMPLOYEE_TYPE_MAP.EMPLOYEE,EMPLOYEE_TYPE_MAP.ADMIN,EMPLOYEE_TYPE_MAP.HR)

  async allMessages(@Param("roomId") id: string) {
    
    const data = await this.chatService.allMessages(id);
    return data;
  }

  @Get('users-list')
  async getUserList(@UserDetails() user: any) {
    let prm = {};
    let attn = {};

    prm = { _id: { $ne: user?._id } };
    attn = { role: user?.role };
    const data = await this.chatService.listUser(
      prm, attn
    )
    return data;
  }

  @Post('upload-group-profile')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema:{
      type:"object",
      properties:{
        file:{
          type:'string',
          format:'binary',
          description:"group chat image"
        },
        roomId :{
          type:'string',
          description:"give the roomId"
        }
      }
    }
  })
  async uploadGroupProfile(
    @Body() roomId:{roomId:string},
    @UploadedFile(
      new ParseFilePipe({
        validators:[
          new FileTypeValidator({fileType:"image/*"})
        ]
      })
    )
    file:Express.Multer.File,
    @UserDetails() user: any,
  ){
    
    const {success, message, data:roomDetail} = await this.chatService.getRoomDetail(roomId?.roomId);
   if(success){
   this.logger.log(roomDetail);
   if(roomDetail?.basicDetails?.groupProfile){
    this.fileUploadService.deleteFile(roomDetail?.basicDetails?.groupProfile);
   }
   let fileName=`${generateRandomString(20)}.${file.mimetype.split('/')[1]}`;

  fileName = `${user?.userId?._id}/groupPhoto/${fileName}`;
  this.fileUploadService.uploadFile(file.buffer, fileName)

  // update the group profile Photo
  const data = await this.chatService.updateRoomProfilePhoto(
    roomId?.roomId,
    fileName
  )
  this.logger.log(data)
  return data;
   }

   return {message:"Something went wrong", success:false}
  }

  @Post('upload-file')
  async uploadDocuments(
    @Body() body:CreateChatFileCredentialDto,
    @UserDetails() user:any,
  ){
    
    const roomId = body.id;
    let results=[]

    await Promise.all(body?.files?.map(async (file, index) => {
       try{
        const fileKey = uuidv4(); // Unique ID for the file
        
      const key = `${roomId}/files/${file.filename}${Date.now()}`;

      const signedUrl = await this.fileUploadService.createSignedUrl({
        filename: key,
        type: file.type,
      });

      const cacheTime = calculateProcessingTime(file.size)  ; // Cache time based on file size, logarithmic scale
      // this.logger.log(`file size: ${file.size}: ${cacheTime} seconds`);
      // this.logger.log(`Cache time for file ${file.filename}: ${cacheTime} seconds`);

      // Cache file metadata for later validation
      await this.redisService.setInCache(
        fileKey,
        JSON.stringify({
          filename: file.filename,
          key,
          size: file.size,
        }),
        cacheTime
      );

      results.push({ fileKey, signedUrl });
      return ;
      }catch(err){
        throw new BadRequestException(err.message ?? "something went wrong at create Signed URL");
      }
    }));

    

    return {
      success: true,
      message: 'Pre-signed URLs generated successfully',
      data: results,
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
      };
  
  
      if (!cachedFile) {
        throw new BadRequestException('File upload session expired or invalid');
      }
  
      const { filename, key, size } = pasredData;
  
      // Check if the file exists in S3
      const isUploaded = await this.fileUploadService.verifyFileInS3(key);
      if (!isUploaded) {
        throw new BadRequestException('File not found in S3');
      }
  
  
      // Clean up cached metadata
      await this.redisService.destroy(fileKey);
  
      return {
        success: true,
        message: 'File upload finalized successfully',
        key:key
      };
    }

}
