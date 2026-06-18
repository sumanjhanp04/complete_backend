import { Module } from '@nestjs/common';
import { FileCredentialsController } from './controllers/file-credentials.controller';
import { FileCredentialsService } from './services/file-credentials.service';
import { FileUploadModule } from '@app/file-upload';
import { MongooseModule } from '@nestjs/mongoose';
import {
  FileCredential,
  FileCredentialSchema,
} from '@lib/database/schemas/credentials/file-credentials.schema';
import { CredentialsController } from './controllers/credentials.controller';
import { AccountCredentialsService } from './services/account-credentials.service';

import {
  Credentials,
  CredentialsSchema,
} from '@lib/database/schemas/credentials/credentials.schema';
import {
  AccountCredentials,
  AccountCredentialsSchema,
} from '@lib/database/schemas/credentials/account-credentials.schema';
import { AccountCredentialsController } from './controllers/account-credentials.controller';
import { CredentialsService } from './services/credentials.service';
import { encryptModule } from '@lib/common/encrypt/src/encrypt.module';
import { AUTH_SERVICE } from '@lib/common';
import { RmqModule } from '@lib/rmq';
import { RedisCacheModule } from 'libs/cache/src';
import { DatabaseModule } from '@lib/database';
@Module({
  imports: [
    DatabaseModule,
    FileUploadModule,
    encryptModule,
    RmqModule.register({ name: AUTH_SERVICE }),
    RedisCacheModule,
  ],
  controllers: [
    FileCredentialsController,
    CredentialsController,
    AccountCredentialsController,
  ],
  providers: [
    FileCredentialsService,
    CredentialsService,
    AccountCredentialsService,
  ],
  exports: [FileCredentialsService],
})
export class CredentialsModule { }
