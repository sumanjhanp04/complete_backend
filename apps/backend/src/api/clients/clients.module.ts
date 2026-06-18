import { Module } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { ClientsController } from './clients.controller';
import { DatabaseModule } from '@lib/database';
import { RmqModule } from '@lib/rmq';
import { AUTH_SERVICE } from '@lib/common';

@Module({
  imports: [DatabaseModule, RmqModule.register({ name: AUTH_SERVICE })],
  controllers: [ClientsController],
  providers: [ClientsService],
  exports: [ClientsService]
})
export class ClientModule {}
