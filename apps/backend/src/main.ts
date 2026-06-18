import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { RmqService } from '@lib/rmq';
import { AUTH_SERVICE } from '@lib/common';
import { ConfigService } from '@nestjs/config';
import { setupSwagger } from '@lib/config';
import { AuthGuard } from '@lib/guards';
import { JwtService } from '@nestjs/jwt';
import { UserService } from './api/user/user.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // app.setGlobalPrefix('api');

  const configService = app.get<ConfigService>(ConfigService);

  const jwtService = app.get(JwtService);
  const reflector = app.get(Reflector);
  const userService = app.get(UserService);

  app.useGlobalGuards(new AuthGuard(jwtService, reflector, userService));

  if (configService.get('NODE_ENV') === 'prod') {
    app.enableCors({
      origin: ['https://ems.pasdgtal.com'],
      credentials: true,
    });
  } else {
    console.log(configService.get('ALLOWED_ORIGIN'));
    app.enableCors({
      origin: JSON.parse(configService.get('ALLOWED_ORIGIN')),
      credentials: true,
    });

    setupSwagger(app);
  }

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));//updated temporarily 

  const rmqService = app.get<RmqService>(RmqService);
  app.connectMicroservice(rmqService.getOptions(AUTH_SERVICE));

  console.log(
    `running on ${configService.get('HTTP_PORT')} and office ips are ${process.env.IP}`,
  );

  await app.startAllMicroservices();
  await app.listen(configService.get('HTTP_PORT'));
}
bootstrap();
