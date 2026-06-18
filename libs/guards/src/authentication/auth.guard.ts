import { IS_PUBLIC_ROUTE } from '@lib/decorators';
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'apps/backend/src/api/user/user.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
    private readonly userService: UserService,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const handler = context.getHandler();
    const isPublic = this.reflector.get<boolean>(IS_PUBLIC_ROUTE, handler);

    // If the route is marked as public, skip authentication
    if (isPublic) {
      return true;
    }

    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('You are not authorized');
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('You are not authorized');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });

      const user = await this.userService.getPopulatedUser(payload?.user);

      request.user = user;
      return true;
    } catch (err) {

      throw new UnauthorizedException('Please login again !');
    }
  }
}
