import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { DatabaseModule } from '@lib/database';
import { ConfigModule } from '@lib/config';
import { TokenModule } from '@lib/token';
import { AUTH_SERVICE, NOTIFICATION_SERVICE } from '@lib/common';
import { RmqModule } from '@lib/rmq';

import { RedisCacheModule } from 'libs/cache/src';
import { CredentialsModule } from '../credentials/credentials.module';

@Module({
  imports: [
    DatabaseModule,
    ConfigModule,
    TokenModule,
    RmqModule.register({ name: NOTIFICATION_SERVICE }),
    RmqModule.register({ name: AUTH_SERVICE }),
    RedisCacheModule,
    CredentialsModule,
  ],
  controllers: [UserController],
  providers: [UserService],

})
export class UserModule { }
