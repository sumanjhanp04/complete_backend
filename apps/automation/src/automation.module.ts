import { Module } from '@nestjs/common';

// Controller that exposes APIs
import { AutomationController } from './automation.controller';

// Service containing queue business logic
import { AutomationService } from './automation.service';

// BullMQ integration package for NestJS
import { BullModule } from '@nestjs/bullmq';

// Processor (Worker) that executes jobs
import { AutomationProcessor } from './automation.processor';

/*
|--------------------------------------------------------------------------
| Automation Module
|--------------------------------------------------------------------------
| This module manages:
|
| 1. Redis Connection
| 2. BullMQ Queue Registration
| 3. Controllers
| 4. Services
| 5. Workers (Processors)
|--------------------------------------------------------------------------
*/

@Module({
  imports: [
    /*
    |--------------------------------------------------------------------------
    | Redis Connection Configuration
    |--------------------------------------------------------------------------
    |
    | BullMQ requires Redis.
    | All jobs are stored in Redis.
    |
    | NestJS
    |    ↓
    | BullMQ
    |    ↓
    | Redis
    |
    |--------------------------------------------------------------------------
    */
    BullModule.forRoot({
      connection: {
        host: '110.225.25.2', // Redis Server IP
        port: 6379,           // Redis Default Port
        password: 'Pasdt1234', // Redis Password
      },
    }),

    /*
    |--------------------------------------------------------------------------
    | Queue Registration
    |--------------------------------------------------------------------------
    |
    | Creates queue:
    |
    | jobQueue2
    |
    | Jobs will be added into this queue.
    |
    |--------------------------------------------------------------------------
    */
    BullModule.registerQueue({
      name: 'jobQueue2',
    }),
  ],

  /*
  |--------------------------------------------------------------------------
  | Controllers
  |--------------------------------------------------------------------------
  |
  | Handles HTTP Requests
  |
  | Example:
  | GET /add
  | GET /remove/:id
  | GET /resch/:id
  |
  |--------------------------------------------------------------------------
  */
  controllers: [AutomationController],

  /*
  |--------------------------------------------------------------------------
  | Providers
  |--------------------------------------------------------------------------
  |
  | AutomationService:
  |    Contains queue logic.
  |
  | AutomationProcessor:
  |    Worker that executes jobs.
  |
  |--------------------------------------------------------------------------
  */
  providers: [AutomationService, AutomationProcessor],
})
export class AutomationModule { }