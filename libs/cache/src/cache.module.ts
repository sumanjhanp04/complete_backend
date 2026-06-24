// Import Module decorator from NestJS
import { Module } from '@nestjs/common';

// Import RedisService from cache.service.ts
import { RedisService } from './cache.service';

// @Module() tells NestJS that this class is a module
@Module({
  // Services that belong to this module
  // NestJS will create and manage an instance of RedisService
  providers: [RedisService],

  // Services/modules that can be used by other modules
  exports: [
    RedisCacheModule, // Export this module itself
    RedisService, // Export RedisService so other modules can inject it
  ],
})

// Module class
// This module groups all Redis-related functionality
export class RedisCacheModule {}
