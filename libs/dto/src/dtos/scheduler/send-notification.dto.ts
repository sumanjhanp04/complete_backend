import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

enum ToastStatus {
  ERROR = 'error',
  SUCCESS = 'success',
  WARNING = 'warning',
  INFO = 'info',
}

export class SendNotificationDto {
  @IsEnum(ToastStatus)
  type: ToastStatus = ToastStatus.INFO;

  @IsString()
  @IsNotEmpty()
  notifier: string;

  @IsString()
  @IsOptional()
  actor: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => Object)
  data: Record<string, any>;

  @IsString()
  @IsOptional()
  redirectUrl: string;

  @IsString()
  @IsOptional()
  status: string;

  @IsBoolean()
  saveToDb: boolean = false;
}
