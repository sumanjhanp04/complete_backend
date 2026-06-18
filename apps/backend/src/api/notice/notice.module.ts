// Purpose: File module for handling file uploads and downloads.
import { Module } from '@nestjs/common';
import { NoticeService } from './notice.service';
import { NoticeController } from './notice.controller';
import { FileUploadService } from '../../../../../libs/file-upload/src/file-upload.service';
import { FileUploadModule } from '@app/file-upload';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Notice,
  NoticeSchema,
} from '@lib/database/schemas/notices/notice.schema';
import { RedisCacheModule } from '@app/cache/cache.module';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([{ name: Notice.name, schema: NoticeSchema }]),
    FileUploadModule,
    RedisCacheModule,
  ],
  controllers: [NoticeController],
  providers: [NoticeService, FileUploadService],
})
export class NoticeModule {}
