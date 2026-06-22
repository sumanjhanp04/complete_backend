import { NestFactory } from '@nestjs/core';
import { AutomationModule } from './automation.module';

/*
|--------------------------------------------------------------------------
| Application Bootstrap
|--------------------------------------------------------------------------
|
| This is the starting point of the application.
|
| NestJS starts from here.
|
|--------------------------------------------------------------------------
*/

async function bootstrap() {

  /*
  |--------------------------------------------------------------------------
  | Create NestJS Application
  |--------------------------------------------------------------------------
  |
  | Load AutomationModule and all its dependencies.
  |
  | Loads:
  | - Controllers
  | - Services
  | - BullMQ
  | - Redis Connection
  | - Processors
  |
  |--------------------------------------------------------------------------
  */
  const app = await NestFactory.create(AutomationModule);

  /*
  |--------------------------------------------------------------------------
  | Start HTTP Server
  |--------------------------------------------------------------------------
  |
  | Application will listen on Port 3000.
  |
  | Example:
  | http://localhost:3000
  |
  |--------------------------------------------------------------------------
  */
  await app.listen(3000);

  console.log(
    '🚀 Automation Service Running at http://localhost:3000',
  );
}

/*
|--------------------------------------------------------------------------
| Start Application
|--------------------------------------------------------------------------
*/
bootstrap();