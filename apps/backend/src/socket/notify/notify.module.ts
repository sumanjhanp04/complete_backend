import { Module } from '@nestjs/common';
import { NotifyService } from './notify.service';
import { NotifyGateway } from './notify.gateway';
import { RmqModule, RmqService } from '@lib/rmq';
import { AUTH_SERVICE } from '@lib/common';
import { DatabaseModule } from '@lib/database';
import { NotifyController } from './notify.controller';
import { JwtModule } from '@nestjs/jwt';
import { NotifyHelperService } from './notify-helper.service';
import { RedisCacheModule } from '@app/cache/cache.module';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

@Module({

  /*
  |--------------------------------------------------------------------------
  | Imported Modules
  |--------------------------------------------------------------------------
  */
  imports: [

    /**
     * Database Module
     *
     * Provides MongoDB schemas/models:
     * - Notification
     * - User
     * - Calendar
     * etc.
     */
    DatabaseModule,

    /**
     * JWT Module
     *
     * Used for:
     * - Token Verification
     * - Socket Authentication
     */
    JwtModule,

    /**
     * Redis Cache Module
     *
     * Provides RedisService
     * Used for:
     * - Caching
     * - Session Storage
     * - Fast Lookup
     */
    RedisCacheModule,

    /**
     * RabbitMQ Client Registration
     *
     * Creates RabbitMQ connection
     * to Auth Microservice.
     */
    RmqModule.register({
      name: AUTH_SERVICE,
    }),
  ],

  /*
  |--------------------------------------------------------------------------
  | Controllers
  |--------------------------------------------------------------------------
  |
  | RabbitMQ Consumers
  |
  */
  controllers: [

    /**
     * Receives RabbitMQ Messages
     *
     * Example:
     * SEND_ONLINE_USER_NOTIFICATION
     * SEND_SCHEDULE_NOTIFICATION
     */
    NotifyController,
  ],

  /*
  |--------------------------------------------------------------------------
  | Providers
  |--------------------------------------------------------------------------
  |
  | Services available inside module
  |
  */
  providers: [

    /**
     * RabbitMQ Utility Service
     *
     * Used for:
     * - ACK messages
     * - Queue operations
     */
    RmqService,

    /**
     * Main Notification Service
     *
     * Business Logic Layer
     */
    NotifyService,

    /**
     * Socket.IO Gateway
     *
     * Handles:
     * - User Connections
     * - Realtime Notifications
     * - WebSocket Events
     */
    NotifyGateway,

    /**
     * Helper Service
     *
     * Handles:
     * - Notification Queries
     * - Token Validation
     * - Read/Dismiss Operations
     */
    NotifyHelperService,

    /**
     * Mock CACHE_MANAGER Provider
     *
     * Prevents dependency injection errors
     * if cache manager is required somewhere.
     */
    {
      provide: CACHE_MANAGER,
      useValue: {},
    },
  ],

  /*
  |--------------------------------------------------------------------------
  | Exports
  |--------------------------------------------------------------------------
  |
  | Makes NotifyService available
  | to other modules.
  |
  */
  exports: [

    /**
     * Can be injected into
     * other modules/services.
     */
    NotifyService,
  ],
})
export class NotifyModule { }