// roles.guard.ts

import {
    Injectable,
    CanActivate,
    ExecutionContext,
    Logger,
    BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

@Injectable()
export class AccessGuard implements CanActivate {
    private logger = new Logger(AccessGuard.name);
    constructor(private reflector: Reflector) { }

    canActivate(
        context: ExecutionContext,
    ): boolean | Promise<boolean> | Observable<boolean> {
        const request = context.switchToHttp().getRequest();

        const roles = this.reflector.get<string[]>('roles', context.getHandler());
        const userType = this.reflector.get<string[]>('userType', context.getHandler());
        // this.logger.debug(roles)
        // this.logger.debug(userType) 

        
        if (!roles && !userType) {
            this.logger.log(
                `Access Not Checking - ${request.method} - ${request.url}`,
            );
            return true; // No roles specified, allow access
        }
        this.logger.log(`Access Checking ${request.method} - ${request.url}`);

        const user = request['user']; // Assuming you have a user object in your request
        // this.logger.log(user);
        // this.logger.debug(userType)

        if (userType) {
            // this.logger.log(userType)
            const canAccess = userType.includes(user.userType);
            // this.logger.log("inside the userType")
            // this.logger.log(typeof canAccess)
            // this.logger.log(canAccess)
            // if(canAccess == true)
            return canAccess;
        }

        // Check if the user has any of the required roles

        const hasRole = () =>
            user?.userId?.role === 'Hr' ||
            user?.userId?.role === 'Admin' ||
            roles.includes(user?.userId?.role);

        // this.logger.log(hasRole)
        // this.logger.log(user?.userId?.role)

        // this.logger.log(user?.userId?.role)

        if (hasRole()) {
            // this.logger.log("hasRole")
            return true;
        }

        throw new BadRequestException('Not Enough Permission!');

    }
}
