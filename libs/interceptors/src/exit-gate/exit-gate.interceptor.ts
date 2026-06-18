import {
  CallHandler,
  ExecutionContext,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

export class ExitGateInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ExitGateInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startTime = Date.now();
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const url = request.url;

    return next.handle().pipe(
      map((res) => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        const statusCode =
          context.switchToHttp().getResponse().statusCode || 200;
        const logMessage = `${method} ${url} ${statusCode} - ${responseTime}ms`;
        this.logger.log(logMessage);
        return {
          success: true,
          statusCode: statusCode,
          data: res,
          message: 'Req Processed Successfully !',
        };
      }),
    );
  }
}
