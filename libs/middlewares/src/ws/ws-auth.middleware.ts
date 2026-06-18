import { USERS_API_MAPS } from '@lib/common';
import { UserDocument } from '@lib/database';
import { Cache } from '@nestjs/cache-manager';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ClientProxy } from '@nestjs/microservices';
import { Socket } from 'socket.io';

type SocketMiddleware = (socket: Socket, next: (err?: Error) => void) => void;

export const AuthWsMiddleware = (
  jwtService: JwtService,
  cacheManager: Cache,
  authClient: ClientProxy,
): SocketMiddleware => {
  return async (client: Socket, next) => {
    const token = client.handshake.headers.authorization;

    if (!token) {
      return next(new UnauthorizedException('Token not provided'));
    }

    if (token.indexOf('Bearer ') !== 0) {
      return next(new UnauthorizedException('Malformed token structure'));
    }

    const extractedToken = token.substring(7);

    try {
      const jwt = await jwtService.verifyAsync(extractedToken, {
        secret: process.env.JWT_SECRET,
        ignoreExpiration: false,
      });

      const userId = jwt.user;

      let userData = null;
      userData = await cacheManager.get(userId);
      if (userData) {
        // this.logger.log(`user in cache ${userId}`)
        client.handshake.auth = { user: userData };

        // console.log(userData);
      } else {
        // this.logger.log(`user not in cache ${userId}`)
        // fetch user from database

        const data: UserDocument = await authClient
          .send({ cmd: USERS_API_MAPS.GET_USER }, { id: userId })
          .toPromise();

        userData = data;
        // console.log(jsonUser);
        if (userData) {
          await cacheManager.set(userId, userData);
          client.handshake.auth = { user: userData };
        }

        next();
      }
    } catch (error) {
      return next(
        new UnauthorizedException('Invalid token provided - Logging out Users'),
      );
    }
  };
};
