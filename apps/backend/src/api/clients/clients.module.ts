import { Module } from '@nestjs/common';

// Business logic for Clients
import { ClientsService } from './clients.service';

// Handles HTTP APIs and RabbitMQ messages
import { ClientsController } from './clients.controller';

// Provides MongoDB Models/Schemas
import { DatabaseModule } from '@lib/database';

// RabbitMQ module for microservice communication
import { RmqModule } from '@lib/rmq';

// RabbitMQ service name constant
import { AUTH_SERVICE } from '@lib/common';


/*
|--------------------------------------------------------------------------
| Client Module
|--------------------------------------------------------------------------
|
| A Module is a container that groups related files together.
|
| This module contains:
| 1. Controller  -> Receives Requests
| 2. Service     -> Business Logic
| 3. Database    -> MongoDB Access
| 4. RabbitMQ    -> Communication with other microservices
|
|--------------------------------------------------------------------------
*/

@Module({

  /*
  |--------------------------------------------------------------------------
  | Imports
  |--------------------------------------------------------------------------
  |
  | Import other modules required by Client Module.
  |
  */

  imports: [

    /*
    |--------------------------------------------------------------------------
    | Database Module
    |--------------------------------------------------------------------------
    |
    | Makes MongoDB schemas/models available.
    |
    | Example:
    | ClientModel
    | CompanyModel
    |
    */
    DatabaseModule,

    /*
    |--------------------------------------------------------------------------
    | RabbitMQ Registration
    |--------------------------------------------------------------------------
    |
    | Creates a RabbitMQ client connection
    | to AUTH_SERVICE.
    |
    | Used when:
    | - Sending messages
    | - Receiving messages
    | - Authentication related communication
    |
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
  | Entry point for requests.
  |
  | Example:
  |
  | GET  /clients
  | POST /clients
  | PUT  /clients/:id
  |
  */
  controllers: [
    ClientsController,
  ],

  /*
  |--------------------------------------------------------------------------
  | Providers
  |--------------------------------------------------------------------------
  |
  | Services that contain business logic.
  |
  | Controller -> Service -> Database
  |
  */
  providers: [
    ClientsService,
  ],

  /*
  |--------------------------------------------------------------------------
  | Exports
  |--------------------------------------------------------------------------
  |
  | Makes ClientsService available
  | to other modules.
  |
  | Example:
  |
  | EmployeeModule
  | CompanyModule
  | NotificationModule
  |
  | can inject ClientsService.
  |
  */
  exports: [
    ClientsService,
  ],
})

export class ClientModule { }