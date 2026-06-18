// leave-history.dto.ts
import { IsString, IsNumber, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TRANSACTION_TYPE } from '@lib/database'; 

export class CreateLeaveHistoryDto {
  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'User ID associated with the leave history',
    required: false,
  })
  userId?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Leave Request ID associated with the leave history',
    required: false,
  })
  leaveId?: string;

  @IsString()
  @ApiProperty({ description: 'Message describing the leave history event' })
  message: string;

  @IsNumber()
  @ApiProperty({ description: 'Amount of leave' })
  leaveAmount: number;

  @IsEnum(TRANSACTION_TYPE)
  @ApiProperty({ description: 'Type of transaction', enum: TRANSACTION_TYPE })
  transactionType: string;
}

export class UpdateLeaveHistoryDto extends CreateLeaveHistoryDto {}
