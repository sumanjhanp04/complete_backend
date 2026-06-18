import { LEAVE_DURATION, LEAVE_STATUS, STATUS } from '@lib/database';
import { ApiProperty } from '@nestjs/swagger';

import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  IsEnum,
  IsMongoId,
} from 'class-validator';

export class FileMetadata {
  // @ApiProperty({
  //   description: 'The file id',
  //   example: '1',
  // })
  // @IsString()
  // id: string;

  @ApiProperty({
    description: 'The file name',
    example: 'file.jpeg',
  })
  @IsString()
  filename: string;

  @ApiProperty({
    description: 'The file size in bytes',
    example: 1024,
  })
  @IsNumber()
  size: number;

  @ApiProperty({
    description: 'The file content type',
    example: 'image/jpeg',
  })
  @IsString()
  type: string;
}

export class LeaveRequestDto {
  @ApiProperty({
    description: 'Leave type ID',
    example: '60d21b4667d0d8992e610c87',
  })
  @IsMongoId()
  leaveType: string;

  @ApiProperty({ description: 'Leave start date', example: '2025-02-01' })
  @IsString()
  startDate: string;

  @ApiProperty({ description: 'Leave end date', example: '2025-02-05' })
  @IsString()
  endDate: string;

  @ApiProperty({ description: 'Reason for leave', required: false })
  @IsOptional()
  @IsString()
  reasonForLeave?: string;

  @ApiProperty({
    description: 'Leave duration details',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        date: { type: 'string', format: 'date', example: '2025-02-02' },
        leaveDuration: {
          type: 'string',
          enum: Object.values(LEAVE_DURATION),
          example: 'FULL_DAY',
        },
      },
    },
    required: false,
  })
  @IsOptional()
  @IsArray()
  leaveDuration?: { date: Date; leaveDuration: LEAVE_DURATION }[];

  // @ApiProperty({ description: 'Applicable leave days', example: 5 })
  // @IsNumber()
  // applicableLeave: number;

  // @ApiProperty({ description: 'Is sandwich policy applicable?', example: true })
  // @IsBoolean()
  // isSandwichPolicyApplicable: boolean;

  // @ApiProperty({
  //   description: 'Sandwich leave deduction',
  //   example: 1,
  //   required: false,
  // })
  @IsOptional()
  @IsNumber()
  sandwichLeaveDeduction?: number;
  @IsOptional()
  @IsNumber()
  deductedLeaveBalance?: number;
}
export class UpdateLeaveRequestDto {
  @ApiProperty({
    description: 'Leave type ID',
    example: '60d21b4667d0d8992e610c87',
    required: false,
  })
  @IsOptional()
  @IsMongoId()
  leaveType?: string;

  @ApiProperty({
    description: 'Leave start date',
    example: '2025-02-01',
    required: false,
  })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiProperty({
    description: 'Leave end date',
    example: '2025-02-05',
    required: false,
  })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiProperty({ description: 'Reason for leave', required: false })
  @IsOptional()
  @IsString()
  reasonForLeave?: string;

  @ApiProperty({
    description: 'Leave duration details',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        date: { type: 'string', format: 'date', example: '2025-02-02' },
        leaveDuration: {
          type: 'string',
          enum: Object.values(LEAVE_DURATION),
          example: 'FULL_DAY',
        },
      },
    },
    required: false,
  })
  @IsOptional()
  @IsArray()
  leaveDuration?: { date: Date; leaveDuration: LEAVE_DURATION }[];

  @ApiProperty({
    description: 'Deducted leave balance',
    example: 2,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  deductedLeaveBalance?: number;

  @ApiProperty({
    description: 'Current approver ID',
    example: '60d21b4667d0d8992e610c89',
    required: false,
  })
  @IsOptional()
  @IsMongoId()
  forwardTo?: string;
  // @ApiProperty({
  //   description: 'Current approver ID',
  //   example: '60d21b4667d0d8992e610c89',
  //   required: false,
  // })
  // @IsOptional()
  // @IsMongoId()
  // currentReviewer?: string;

  @ApiProperty({
    description: 'Leave status',
    enum: LEAVE_STATUS,
    example: 'PENDING',
    required: false,
  })
  @IsOptional()
  @IsEnum(LEAVE_STATUS)
  leaveStatus?: string;
  @IsOptional()
  @IsString()
  currentReviewerStatus?: string;
  @IsOptional()
  @IsString()
  currentReviewerReasonForStatus?: string;
  
  @ApiProperty({
    description: 'List of approvers',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        order: { type: 'number', example: 1 },
        reviewer: { type: 'string', example: '60d21b4667d0d8992e610c91' },
        status: {
          type: 'string',
          enum: Object.values(STATUS),
          example: 'APPROVED',
        },
        reasonForStatus: {
          type: 'string',
          example: 'Leave approved based on policy',
        },
        timestamp: {
          type: 'string',
          format: 'date-time',
          example: '2025-02-02T10:00:00Z',
        },
      },
    },
    required: false,
  })
  @IsOptional()
  @IsArray()
  approversList?: {
    order: number;
    reviewer: string;
    status: STATUS;
    reasonForStatus?: string;
    timestamp: Date;
  }[];

  @ApiProperty({
    description: 'Applicable leave days',
    example: 5,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  applicableLeave?: number;

  @ApiProperty({
    description: 'Is sandwich policy applicable?',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isSandwichPolicyApplicable?: boolean;

  @ApiProperty({
    description: 'Sandwich leave deduction',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  sandwichLeaveDeduction?: number;
}
