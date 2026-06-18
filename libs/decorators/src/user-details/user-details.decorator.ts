import { User } from '@lib/database';
import { ExecutionContext, createParamDecorator } from '@nestjs/common';

export const UserDetails = createParamDecorator(
  (data, context: ExecutionContext): User => {
    const req = context.switchToHttp().getRequest();
    return req.user;
  },
);
