import { SetMetadata } from '@nestjs/common';

export const UserTypeAccess = (...roles: string[]) => SetMetadata('userType', roles);
