import { SetMetadata } from '@nestjs/common';

export const ValidateIp = (...args: string[]) =>
  SetMetadata('validate-ip', args);
