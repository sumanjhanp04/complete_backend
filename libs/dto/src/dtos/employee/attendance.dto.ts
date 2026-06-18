import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class AddAttendanceDto {
  @ApiProperty({
    description: 'The unique identifier of the employee',
    example: 'EMP123',
  })
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @ApiPropertyOptional({
    description: 'The type of attendance (e.g., Present, Absent, Sick Leave)',
    example: 'Present',
    required: false,
  })
  @IsOptional()
  @IsString()
  attendanceType?: string;

  @ApiPropertyOptional({
    description: 'The unique identifier for the attendance record',
    example: 'ATT456',
    required: false,
  })
  @IsOptional()
  @IsString()
  id?: string;
}

export class ListMyAttendanceDto {
  @ApiProperty({
    description:
      'The unique identifier of the employee whose attendance is being queried',
    example: 'EMP123',
  })
  @IsNotEmpty()
  employeeId: string;

  @ApiPropertyOptional({
    description: 'The month for which the attendance is being queried',
    example: 8,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  month?: number;

  @ApiPropertyOptional({
    description: 'The year for which the attendance is being queried',
    example: 2024,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  year?: number;
}

// DTO for adding breaks
export class AddBreaksDto {
  @ApiProperty({
    description: 'The unique identifier of the employee',
    example: 'EMP123',
  })
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @ApiProperty({
    description: 'The name of the break (e.g., Lunch, Coffee)',
    example: 'Lunch',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'The end time of the break',
    example: '2024-08-05T15:00:00Z',
    required: false,
  })
  @IsOptional()
  endTime?: Date;
}

// DTO for closing breaks
export class CloseBreaksDto {
  @ApiProperty({
    description: 'The unique identifier of the employee',
    example: 'EMP123',
  })
  @IsString()
  @IsNotEmpty()
  employeeId: string;
}
