// ============================================================================
// Notice Module
// ============================================================================
//
// Purpose:
// This module manages the Notice feature of the application.
//
// Responsibilities:
// - Register Notice MongoDB schema
// - Enable AWS S3 file upload functionality
// - Enable Redis caching
// - Load Notice Controller and Service
//
// Architecture:
//
// NoticeModule
//      │
//      ├── NoticeController
//      │        │
//      │        ▼
//      │   NoticeService
//      │        │
//      │        ├── MongoDB (Notice Collection)
//      │        ├── AWS S3 (File Upload)
//      │        └── Redis Cache
//      │
//      └── Supporting Modules
//              ├── ConfigModule
//              ├── FileUploadModule
//              ├── RedisCacheModule
//              └── MongooseModule
//
// ============================================================================

// NestJS decorator used to create a module
import { Module } from '@nestjs/common';

// Service containing all business logic for notices
import { NoticeService } from './notice.service';

// Controller containing API endpoints for notices
import { NoticeController } from './notice.controller';

// Service responsible for uploading files
// (images, PDFs, documents, etc.)
import { FileUploadService } from '../../../../../libs/file-upload/src/file-upload.service';

// Module that provides FileUploadService
import { FileUploadModule } from '@app/file-upload';

// Loads environment variables from .env file
// Example: MONGO_URI, REDIS_URL, AWS credentials
import { ConfigModule } from '@nestjs/config';

// NestJS integration with MongoDB using Mongoose
import { MongooseModule } from '@nestjs/mongoose';

// Notice MongoDB Schema and Model definition
import {
  Notice,        // Notice document/model name
  NoticeSchema,  // Structure of Notice collection
} from '@lib/database/schemas/notices/notice.schema';

// Redis cache module used for caching data
// to improve performance and reduce database calls
import { RedisCacheModule } from '@app/cache/cache.module';

@Module({
  imports: [
    /**
     * ------------------------------------------------------------------------
     * Config Module
     * ------------------------------------------------------------------------
     *
     * Loads environment variables from .env
     *
     * Examples:
     * - AWS_ACCESS_KEY
     * - AWS_SECRET_KEY
     * - REDIS_URL
     * - DATABASE_URL
     *
     * ------------------------------------------------------------------------
     */
    ConfigModule,

    /**
     * ------------------------------------------------------------------------
     * MongoDB Schema Registration
     * ------------------------------------------------------------------------
     *
     * Registers Notice collection with Mongoose.
     *
     * Collection:
     * notices
     *
     * Schema:
     * NoticeSchema
     *
     * Usage inside Service:
     *
     * @InjectModel(Notice.name)
     * private noticeModel: Model<Notice>
     *
     * ------------------------------------------------------------------------
     */
    MongooseModule.forFeature([
      {
        name: Notice.name,
        schema: NoticeSchema,
      },
    ]),

    /**
     * ------------------------------------------------------------------------
     * File Upload Module
     * ------------------------------------------------------------------------
     *
     * Provides AWS S3 functionality.
     *
     * Features:
     * - Generate Signed URLs
     * - Upload Files
     * - Delete Files
     * - Verify Uploaded Files
     *
     * Used By:
     * NoticeController
     *
     * ------------------------------------------------------------------------
     */
    FileUploadModule,

    /**
     * ------------------------------------------------------------------------
     * Redis Cache Module
     * ------------------------------------------------------------------------
     *
     * Used for temporary storage of upload metadata.
     *
     * Example Flow:
     *
     * Create Notice
     *      ↓
     * Generate Signed URL
     *      ↓
     * Store Metadata in Redis
     *      ↓
     * Upload File to S3
     *      ↓
     * Finalize Upload
     *      ↓
     * Save Notice in MongoDB
     *
     * ------------------------------------------------------------------------
     */
    RedisCacheModule,
  ],

  /**
   * --------------------------------------------------------------------------
   * Controllers
   * --------------------------------------------------------------------------
   *
   * Handles HTTP Requests
   *
   * Routes:
   * - POST /notices
   * - POST /notices/finalize/:fileKey
   * - GET /notices
   * - PUT /notices/:id
   * - DELETE /notices/:id
   *
   * --------------------------------------------------------------------------
   */
  controllers: [NoticeController],

  /**
   * --------------------------------------------------------------------------
   * Providers
   * --------------------------------------------------------------------------
   *
   * NoticeService
   * - Business Logic
   * - Database Operations
   *
   * FileUploadService
   * - AWS S3 Operations
   *
   * --------------------------------------------------------------------------
   */
  providers: [NoticeService, FileUploadService],
})
export class NoticeModule { }