import { IsString, IsBoolean, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLeaveTypeDto {
  @ApiProperty({ description: 'Name of the leave type', example: 'Sick Leave' })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Optional description of the leave type',
    example: 'Leave granted for sickness',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Amount deducted for taking this leave',
    example: 200,
  })
  @IsOptional()
  @IsNumber()
  leaveDeductionAmount?: number;

  @ApiPropertyOptional({
    description: 'Indicates if deduction is applicable',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  leaveDeductionApplicable?: boolean;
}

export class UpdateLeaveTypeDto {
  @ApiPropertyOptional({
    description: 'Updated name of the leave type',
    example: 'Medical Leave',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Updated description of the leave type',
    example: 'Updated leave description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Updated deduction amount',
    example: 150,
  })
  @IsOptional()
  @IsNumber()
  leaveDeductionAmount?: number;

  @ApiPropertyOptional({
    description: 'Updated deduction applicability',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  leaveDeductionApplicable?: boolean;
}
