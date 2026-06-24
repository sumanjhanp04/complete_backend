
// This file is the complete blueprint of the Calendar System, defining:

// ✓ Event Information
// ✓ Meeting Information
// ✓ Online Meeting Links
// ✓ Attendees
// ✓ Recurring Event Rules
// ✓ Shift Based Events
// ✓ User Based Events
// ✓ Reminder Configuration
// ✓ Notification Settings
// ✓ Validation Rules
// ✓ Swagger Documentation

// That's why I recommended earlier that you start learning the PAS
//  project from the Calendar module—it contains many real-world 
// backend concepts (DTOs, validation, scheduling, notifications, recurring logic,
//  and user targeting) in a single feature.

import { CALENDAR_EVENT_TYPE } from '@lib/database';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
class NotificationDto {
  @ApiProperty({
    description: 'Type of the notification',
    enum: ['email', 'inApp'],
  })
  @IsEnum(['email', 'inApp'], {
    message: 'Type must be either "email" or "inApp"',
  })
  type: string;
  @ApiProperty({
    description: 'Type of the notification',
    enum: ['minutes', 'hour', 'days'],
  })
  @IsEnum(['minutes', 'hour', 'days'], {
    message: 'Type must be either "email" or "inApp"',
  })
  timeUnit: string;

  @ApiProperty({
    description: 'Reminder message for the notification',
    example: 'This is your reminder.',
  })
  @IsString({ message: 'Reminder must be a string' })
  reminder: string;
}

export class CreateCalendarDto {
  @ApiProperty({ type: String, description: 'Event name', required: true })
  @IsString()
  name: string;

  @ApiProperty({
    type: String,
    description: 'Event description',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  description: string;

  @ApiProperty({
    type: String,
    description: 'Event type',
    enum: CALENDAR_EVENT_TYPE,
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsEnum(CALENDAR_EVENT_TYPE)
  type: string;

  @IsOptional()
  @IsEnum(['EMPLOYEES', 'CLIENTS', 'SPECIFIC','SHIFT'])
  userType: string;

  @ApiProperty({
    type: String,
    description: 'Event location',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  location: string;

  @ApiProperty({
    type: String,
    description: 'Event timezone',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  timezone: string;

  @ApiProperty({
    type: String,
    description: 'Event Start Date',
    required: true,
  })
  @IsString()
  startDate: string;

  @ApiProperty({ type: String, description: 'Event End Date', required: true })
  @IsString()
  endDate: string;

  @ApiProperty({
    type: String,
    description: 'Event start  time',
    required: false,
  })
  @IsString()
  @IsOptional()
  startTime: string;

  @ApiProperty({
    type: String,
    description: 'Event end  time',
    required: false,
  })
  @IsString()
  @IsOptional()
  endTime: string;

  @ApiProperty({ type: String, description: 'Event color', default: '#28b463' })
  @IsString()
  color: string;

  @ApiProperty({
    type: [String],
    description: 'List of attendee IDs',
    required: false,
    isArray: true,
  })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  attendees: string[];

  @ApiProperty({
    type: String,
    description: 'Meeting link',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  meetingLink: string;

  @ApiProperty({
    type: Boolean,
    description: 'Recurring Event ',
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isRecurring: boolean;

  @ApiProperty({
    type: String,
    description: 'Owner ID',
    required: true,
  })
  @ApiProperty({
    type: String,
    description: 'Event frequency',
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    required: true,
  })
  @IsEnum(['daily', 'weekly', 'monthly', 'yearly'])
  @IsOptional()
  frequency: string;

  @ApiProperty({
    type: String,
    description: 'Event Schedule Type',
    enum: ['recurring', 'overlapping'],
    required: false,
  })
  @IsOptional()
  scheduleType: string;

  @ApiProperty({
    type: Number,
    description: 'Interval of recurrence',
    required: true,
  })
  @IsNumber()
  @IsOptional()
  interval: number;

  @ApiProperty({
    type: Number,
    description: 'Number of occurrences (optional)',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsNumber()
  count?: number;

  @IsOptional()
  @IsString()
  shift?: string;

  @ApiProperty({
    type: String,
    description: 'Expiry date of recurrence (optional)',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  expiryDate?: string;

  @ApiProperty({
    type: [String],
    description: 'Days of the week for recurring events',
    enum: [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ],
    required: false,
    isArray: true,
  })
  @IsOptional()
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
  daysOfWeek?: string[];

  @ApiProperty({
    description: 'Array of notifications',
    type: [NotificationDto],
    default: [],
  })
  @ValidateNested()
  @IsOptional()
  @Type(() => NotificationDto)
  notifications: NotificationDto[];
}

export class UpdateCalendarDto extends PartialType(CreateCalendarDto) {}
