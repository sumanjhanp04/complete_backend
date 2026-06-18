import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreateEmployeeLeaveBalanceDto {
  @ApiProperty({ description: 'User ID of the employee', example: '12345' })
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'Year for the leave balance', example: 2024 })
  @IsNotEmpty()
  @IsNumber()
  year: number;

  @ApiPropertyOptional({
    description: 'Total paid leave allocated',
    example: 20,
  })
  @IsOptional()
  @IsNumber()
  totalPaidLeave?: number;

  @ApiPropertyOptional({ description: 'Remaining paid leave', example: 15 })
  @IsOptional()
  @IsNumber()
  remainingPaidLeave?: number;

  @ApiPropertyOptional({
    description: 'Number of leave encashments',
    example: 5,
  })
  @IsOptional()
  @IsNumber()
  leaveEncashments?: number;

  @ApiPropertyOptional({
    description: 'Leave carried forward from the previous year',
    example: 3,
  })
  @IsOptional()
  @IsNumber()
  carryForwardedFromPreviousYear?: number;

  @ApiPropertyOptional({
    description: 'Leave carried forward to the next year',
    example: 2,
  })
  @IsOptional()
  @IsNumber()
  carryForwardToNextYear?: number;

  @ApiPropertyOptional({
    description: 'Value of leave encashments',
    example: 5000,
  })
  @IsOptional()
  @IsNumber()
  leaveEncashmentValue?: number;
}

export class UpdateEmployeeLeaveBalanceDto {
  @ApiPropertyOptional({
    description: 'Total paid leave allocated',
    example: 20,
  })
  @IsOptional()
  @IsNumber()
  totalPaidLeave?: number;

  @ApiPropertyOptional({ description: 'Remaining paid leave', example: 15 })
  @IsOptional()
  @IsNumber()
  remainingPaidLeave?: number;

  @ApiPropertyOptional({
    description: 'Number of leave encashments',
    example: 5,
  })
  @IsOptional()
  @IsNumber()
  leaveEncashments?: number;

  @ApiPropertyOptional({
    description: 'Leave carried forward from the previous year',
    example: 3,
  })
  @IsOptional()
  @IsNumber()
  carryForwardedFromPreviousYear?: number;

  @ApiPropertyOptional({
    description: 'Leave carried forward to the next year',
    example: 2,
  })
  @IsOptional()
  @IsNumber()
  carryForwardToNextYear?: number;

  @ApiPropertyOptional({
    description: 'Value of leave encashments',
    example: 5000,
  })
  @IsOptional()
  @IsNumber()
  leaveEncashmentValue?: number;
}
