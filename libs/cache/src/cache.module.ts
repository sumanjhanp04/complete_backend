import { Module } from '@nestjs/common';
import { RedisService } from './cache.service';

@Module({
  providers: [RedisService],
  exports: [RedisCacheModule, RedisService],
})
export class RedisCacheModule { }