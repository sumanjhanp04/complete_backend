import {
  Injectable,
  Logger,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'apps/backend/src/api/user/user.service';

@Injectable()
export class TokenCheckerMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TokenCheckerMiddleware.name);
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) { }
  async use(request: Request, res: Response, next: () => void) {
    this.logger.log('Checking token');
    const authorizationHeader = request.headers['authorization'];
    if (!authorizationHeader) {
      throw new UnauthorizedException('Missing Token');
    }

    const [bearer, token] = authorizationHeader.split(' ');

    if (bearer !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid authorization header');
    }

    try {
      // eslint-disable-next-line no-var
      var { user: userId } = await this.jwtService.verifyAsync(token);
    } catch (err) {
      throw new UnauthorizedException('Token  is invalid');
    }

    const user = await this.userService.getPopulatedUser(userId);



    if (!user) {
      throw new UnauthorizedException('Please Login Again');
    }
    request['user'] = user;

    return next();
  }
}
