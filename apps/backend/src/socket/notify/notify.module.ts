import { Module } from '@nestjs/common';
import { NotifyService } from './notify.service';
import { NotifyGateway } from './notify.gateway';
import { RmqModule, RmqService } from '@lib/rmq';
import { AUTH_SERVICE } from '@lib/common';
import { DatabaseModule } from '@lib/database';
import { NotifyController } from './notify.controller';
import { JwtModule } from '@nestjs/jwt';
import { NotifyHelperService } from './notify-helper.service';
import { RedisCacheModule } from '@app/cache/cache.module';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

@Module({
  imports: [
    DatabaseModule,
    JwtModule,
    RedisCacheModule,
    RmqModule.register({ name: AUTH_SERVICE }),
  ],
  controllers: [NotifyController],
  providers: [
    RmqService,
    NotifyService,
    NotifyGateway,
    NotifyHelperService,
    {
      provide: CACHE_MANAGER,
      useValue: {},
    },
  ],
  exports:[
    NotifyService,
  ]
})
export class NotifyModule { }

