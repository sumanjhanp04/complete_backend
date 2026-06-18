import { NestFactory } from '@nestjs/core';
import { AutomationModule } from './automation.module';

async function bootstrap() {
  const app = await NestFactory.create(AutomationModule);
  await app.listen(3000);
}
bootstrap();
