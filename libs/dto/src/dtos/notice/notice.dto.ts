import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsDate,
  IsArray,
  IsNumber,
  ValidateNested,
  // ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
export class FileMetadata {
  @ApiProperty({
    description: 'The file name',
    type: String,
    required: true,
    example: 'file.jpeg',
  })
  @IsString()
  filename: string;

  @ApiProperty({
    description: 'The file size in bytes',
    type: Number,
    required: true,
    example: 1024,
  })
  @IsNumber()
  size: number;

  @ApiProperty({
    description: 'The file content type',
    type: String,
    required: true,
    example: 'image/jpeg',
  })
  @IsString()
  type: string;
}

export class CreateNoticeDto {
  @ApiProperty({
    description: 'Title of the file',
    example: 'Employee Details',
  })
  @IsString()
  title: string;

  @ApiPropertyOptional({
    description: 'Description of the file',
    example: 'Detailed report on employee performance',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Shift IDs referenced from the Shift schema',
    type: [String],
    example: ['643f5a2b1c4e8837b29d4e3a'],
  })
  // @Transform(({ value }) => value.split(','))
  @IsArray()
  @IsOptional()
  shift?: string[];

  @ApiPropertyOptional({
    description: 'Department IDs referenced from the Department schema',
    type: [String],
    example: ['643f5a2b1c4e8837b29d4e3b'],
  })
  // @Transform(({ value }) => value.split(','))
  @IsArray()
  @IsOptional()
  department?: string[];

  @ApiPropertyOptional({
    description: 'Employee IDs referenced from the Employee schema',
    type: [String],
    example: ['643f5a2b1c4e8837b29d4e3c'],
  })
  // @Transform(({ value }) => value.split(','))
  @IsArray()
  @IsOptional()
  employeeId?: string[];

  @ApiPropertyOptional({
    description: 'Expiry date for the file',
    example: '2024-08-05',
  })
  @IsString()
  @IsOptional()
  expiryDate?: string;

  @ApiProperty({
    type: () => [FileMetadata],
    description: 'The files to upload',
    required: true,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FileMetadata)
  files: FileMetadata[];
}


export class UpdateNoticeDto {
  @ApiPropertyOptional({
    description: 'Title of the file',
    example: 'Employee Details',
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    description: 'Description of the file',
    example: 'Detailed report on employee performance',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Shift IDs referenced from the Shift schema',
    type: [String],
    example: ['643f5a2b1c4e8837b29d4e3a'],
  })
  @IsArray()
  @IsOptional()
  shift?: string[];

  @ApiPropertyOptional({
    description: 'Department IDs referenced from the Department schema',
    type: [String],
    example: ['643f5a2b1c4e8837b29d4e3b'],
  })
  @IsArray()
  @IsOptional()
  department?: string[];

  @ApiPropertyOptional({
    description: 'Employee IDs referenced from the Employee schema',
    type: [String],
    example: ['643f5a2b1c4e8837b29d4e3c'],
  })
  @IsArray()
  @IsOptional()
  employeeId?: string[];

  @ApiPropertyOptional({
    description: 'Expiry date for the file',
    example: '2024-01-20',
    required: false,
  })
  @IsString()
  @IsOptional()
  expiryDate?: string;
}
