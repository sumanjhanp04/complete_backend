import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

class NotificationDto {
  @IsEnum(['email', 'inApp'], {
    message: 'Type must be either "email" or "inApp"',
  })
  type: string;

  @IsEnum(['minutes', 'hour', 'days'], {
    message: 'Type must be either "email" or "inApp"',
  })
  timeUnit: string;

  @IsString({ message: 'Reminder must be a string' })
  reminder: string;
}

export class SchedulerDto {
  @IsString()
  id: string;

  @IsString()
  type: string;

  @IsEnum(['daily', 'weekly', 'monthly', 'yearly'])
  frequency: string;

  @IsNumber()
  @IsOptional()
  interval?: number;

  @IsString()
  @IsOptional()
  startTime?: string;

  @IsString()
  @IsOptional()
  specificDate: string;

  @IsNumber()
  @IsOptional()
  count?: number;

  @IsString()
  @IsOptional()
  expiryDate?: string;

  @IsArray()
  @IsEnum(
    [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ],
    { each: true },
  )
  @IsOptional()
  daysOfWeek?: string[];

  @IsOptional()
  @IsString()
  reminder?: string;

  @ValidateNested({ each: true })
  @Type(() => NotificationDto)
  notifications: NotificationDto[];
}
