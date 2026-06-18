import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class IpsecMiddleware implements NestMiddleware {
  private logger = new Logger(IpsecMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    if (process.env.NODE_ENV !== 'prod') {
      const xRealIp = req.headers['x-real-ip']?.toString();
      const forwardedIp = req.headers['x-forwarded-for']?.toString();
      const normalIp = req.socket.remoteAddress
        .split(':').pop()?.toString();
      const user = req['user'];



      // For production
      const officeIps = process.env.IP?.split(',');
      this.logger.log(
        `xReal: ${xRealIp} -> ${officeIps.includes(xRealIp)},  xForwarded: ${forwardedIp} -> ${officeIps.includes(forwardedIp)},  Normal IP: ${normalIp} -> ${officeIps.includes(normalIp)}`,
      );

      if (
        !(
          officeIps.includes(normalIp) ||
          officeIps.includes(xRealIp) ||
          officeIps.includes(forwardedIp)
        ) &&
        !(user && user.workfromhome)
      ) {
        return res.json({
          message: 'Enter into office network.',
          success: false,
        });
      }

      next(); // Proceed to the next middleware
    } else {
      this.logger.log(`${process.env.NODE_ENV} - Skipping IP SEC`);
      next();
    }
  }
}
