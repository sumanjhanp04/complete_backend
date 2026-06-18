import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Reflector } from '@nestjs/core';

export function setupSwagger(app: INestApplication) {
  const reflector = app.get(Reflector);

  const options = new DocumentBuilder()
    .setTitle('PASDT EMS')
    .setDescription('PASDT Employee Management System and Project Management')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, options);

  SwaggerModule.setup('api', app, document);
}
