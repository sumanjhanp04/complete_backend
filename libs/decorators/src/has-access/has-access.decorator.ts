// roles.decorator.ts

import { SetMetadata } from '@nestjs/common';

export const HasAccess = (...roles: string[]) => SetMetadata('roles', roles);
