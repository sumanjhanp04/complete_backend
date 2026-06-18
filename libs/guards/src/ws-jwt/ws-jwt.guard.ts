import { RedisService } from '@app/cache/cache.service';
import { AUTH_SERVICE, USERS_API_MAPS } from '@lib/common';
import { UserDocument } from '@lib/database';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
  Inject,
  HttpStatus,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class WsJwtGuard implements CanActivate {
  private logger = new Logger(WsJwtGuard.name);

  constructor(
    // @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly jwtService: JwtService,
     public readonly redisService: RedisService, 
    @Inject(AUTH_SERVICE) private readonly authClient: ClientProxy,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient();
    const token = client.handshake.headers.authorization;

    this.logger.log({token})

    if (!token) {
      this.logger.debug('Token not provided');
      client.emit('error', {
        success: false,
        message: 'Token not provided',
        statusCode: HttpStatus.UNAUTHORIZED,
        data: null,
      });
      return false;
    }
    if (token.indexOf('Bearer ') !== 0) {
      client.emit('error', {
        success: false,
        message: 'Malformed token structured',
        statusCode: HttpStatus.UNAUTHORIZED,
        data: null,
      });
      return false;
    }
    const extractedToken = token.substring(7);
    // console.log(extractedToken)
    try {
      const jwt = await this.jwtService.verifyAsync(extractedToken, {
        secret: process.env.JWT_SECRET,
        ignoreExpiration: false,
      });

      const userId = jwt.user;

      let userData = null;
      
      userData = await this.redisService.getFromCache(userId);
      if (userData) {
        // this.logger.log(`user in cache ${userId}`)
        userData = JSON.parse(userData);
        client.handshake.auth = { user: userData };
        return true;
        // console.log(userData);
      } else {
        // this.logger.log(`user not in cache ${userId}`)
        // fetch user from database
        const data: UserDocument = await this.authClient
          .send({ cmd: USERS_API_MAPS.GET_USER }, { id: userId })
          .toPromise();

        userData = data;
        // console.log(jsonUser);
        if (userData) {
          
          await this.redisService.setInCache(userId, JSON.stringify(userData),300);
          client.handshake.auth = { user: userData };
          return true;
        }

        return false;
      }
    } catch (error) {
      this.logger.log({error:error.message})
      this.logger.error('Invalid token provided - Logouting Users');
      client.emit('error', {
        success: false,
        message: 'Please Login Again',
        statusCode: HttpStatus.UNAUTHORIZED,
        data: null,
      });
      return false;
    }
  }
}
