import {
    Injectable,
    CanActivate,
    ExecutionContext,
    Logger,
    BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class IpsecGuard implements CanActivate {
    private logger = new Logger(IpsecGuard.name);

    canActivate(context: ExecutionContext): boolean | Promise<boolean> {
        const request = context.switchToHttp().getRequest<Request>();
        const xRealIp = request.headers['x-real-ip']?.toString();
        const forwardedIp = request.headers['x-forwarded-for']?.toString();
        const normalIp = request.socket.remoteAddress?.split(':').pop()?.toString();
        const user = request['user'];

        if (process.env.NODE_ENV === 'prod') {
            const officeIps = process.env.IP?.split(',');

            this.logger.log(officeIps);
            this.logger.log(
                `xReal: ${xRealIp} -> ${officeIps?.includes(xRealIp)},  xForwarded: ${forwardedIp} -> ${officeIps?.includes(forwardedIp)},  Normal IP: ${normalIp} -> ${officeIps?.includes(normalIp)}`
            );

            if (
                !(
                    officeIps?.includes(normalIp) ||
                    officeIps?.includes(xRealIp) ||
                    officeIps?.includes(forwardedIp)
                ) &&
                !(user && user.workfromhome)
            ) {
                // Throwing an exception instead of sending a response directly
                throw new BadRequestException('Enter into office network.');
            }
        } else {
            this.logger.log(`${process.env.NODE_ENV} - Skipping IP SEC`);
        }

        // Return true if the IP check passes
        return true;
    }
}
