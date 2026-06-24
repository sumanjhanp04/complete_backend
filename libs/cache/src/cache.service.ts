// NestJS decorators and lifecycle hooks
import {
  Injectable, // Makes this class injectable through Dependency Injection
  OnModuleInit, // Called automatically when module starts
  OnModuleDestroy, // Called automatically when module shuts down
  Logger, // NestJS logger
} from '@nestjs/common';

// Used to read values from .env file
import { ConfigService } from '@nestjs/config';

// Redis client package
import { createClient, RedisClientType } from 'redis';

// Marks this class as a service that can be injected
@Injectable()

// Lifecycle hooks implemented
export class RedisService implements OnModuleInit, OnModuleDestroy {
  // Redis client instance
  private client: RedisClientType;

  // Logger instance
  private logger = new Logger(RedisService.name);

  // Constructor Dependency Injection
  constructor(private readonly configService: ConfigService) {}

  // ==========================
  // Runs automatically when NestJS starts
  // ==========================
  async onModuleInit() {
    // Create Redis client
    this.client = createClient({
      // Get REDIS_URL from .env
      // Example:
      // REDIS_URL=redis://localhost:6379
      url: this.configService.get<string>('REDIS_URL'),

      // Send ping every second to keep connection alive
      pingInterval: 1000,
    });

    // Connect to Redis server
    await this.client.connect();

    // Log success message
    this.logger.verbose('💁 Redis Client Connected');
  }

  // ==========================
  // Runs automatically when NestJS stops
  // ==========================
  async onModuleDestroy() {
    // Close Redis connection gracefully
    await this.client.quit();
  }

  // ==========================
  // Store data in Redis
  // ==========================
  async setInCache(
    key: string,
    value: string,
    ttl: number = 300, // Default TTL = 300 seconds (5 minutes)
  ): Promise<void> {
    await this.client.set(key, value, {
      EX: ttl, // Expiration time in seconds
    });

    return;
  }

  // ==========================
  // Read data from Redis
  // ==========================
  async getFromCache(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  // ==========================
  // Delete data from Redis
  // ==========================
  async destroy(key: string): Promise<Boolean | null> {
    // Delete key
    const d = await this.client.del(key);

    // Redis returns:
    // 1 = deleted
    // 0 = key not found
    return d === 1;
  }
}
