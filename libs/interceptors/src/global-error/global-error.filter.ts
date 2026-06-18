import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { MongooseError } from 'mongoose';

@Catch()
export class GlobalErrorFilter<T> implements ExceptionFilter {
  private readonly logger = new Logger(GlobalErrorFilter.name)
  catch(exception: T, host: ArgumentsHost) {


    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();


    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    this.logger.log(exception)

    if (exception instanceof TypeError) {
      status = HttpStatus.BAD_REQUEST;
      message = exception?.message;
      // this.logger.log("inside the instance of typeError")
      // this.logger.log(message)
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      message =
        (exception.getResponse() as any).message ||
        exception.message ||
        'Internal server error';
        // this.logger.log("inside the instance of HttpException")
      // this.logger.log(message)
    } else if (exception instanceof MongooseError) {
      // Handle Mongoose specific errors
      status = HttpStatus.BAD_REQUEST; // Set appropriate status code for Mongoose errors
      message = this.getMongooseErrorMessage(exception);
    }

    if (Array.isArray(message)) {
      message = message.join(',');
    }

    this.logger.log(message)

    response.status(status).json({
      success: false,
      data: null,
      message,
      statusCode: status,
    });
  }

  private getMongooseErrorMessage(error: MongooseError): string {
    if (error.name === 'ValidationError') {
      // Handle Mongoose Validation Errors
      if (error.message) {
        const pathRegex = /Path `([^`]*)` is required/g;
        let match;
        const paths: string[] = [];

        // Find all matches
        while ((match = pathRegex.exec(error.message)) !== null) {
          paths.push(match[1]);
        }

        const errorMessages =
          paths.length > 0
            ? paths.map((path) => `${path} is required`).join(', ')
            : 'Unknown validation error';



        return errorMessages;
      }
      return Object.values(error)
        .map((e: any) => e.message)
        .join(', ');
    } else if (error.name === 'CastError') {
      // Handle Mongoose Cast Errors
      return `Invalid value for ${error.name}`;
    } else if (error.name === 'MongoError') {
      // Handle general MongoDB Errors
      return error.message;
    } else if (error.name === '')
      // Add more cases as needed for other Mongoose errors
      return 'A database error occurred';
  }
}
