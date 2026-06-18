import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { ChatController } from './chat.controller';
import { DatabaseModule } from '@lib/database';
import { TokenModule } from '@lib/token';
import { RmqModule } from '@lib/rmq';
import { AUTH_SERVICE } from '@lib/common';
import { RedisCacheModule } from '@app/cache/cache.module';
import { FileUploadModule } from '@app/file-upload';
import { FileCredentialsService } from '../../api/credentials/services/file-credentials.service';


@Module({
  imports: [
    DatabaseModule,
    TokenModule,
    RedisCacheModule,
    
    FileUploadModule,
    RmqModule.register({ name: AUTH_SERVICE }),
  ],
  providers: [ChatGateway, ChatService, FileCredentialsService,],
  controllers: [ChatController],
})
export class ChatModule {}
