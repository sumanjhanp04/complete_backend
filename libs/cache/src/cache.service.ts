import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClientType;
  private logger = new Logger(RedisService.name);
  constructor(
    private readonly configService: ConfigService
  ) {

  }

  async onModuleInit() {

    this.client = createClient({
      url: this.configService.get<string>('REDIS_URL'),
      pingInterval: 1000,
    });

    await this.client.connect();
    this.logger.verbose('💁 Redis Client Connected');


  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  async setInCache(key: string, value: string, ttl: number=300): Promise<void> {
    await this.client.set(key, value, {
      EX: ttl,
    });

    return
  }

  async getFromCache(key: string): Promise<string | null> {
    return await this.client.get(key);
  }
  async destroy(key: string): Promise<Boolean | null> {
    const d = await this.client.del(key)
    return d === 1
  }
}
