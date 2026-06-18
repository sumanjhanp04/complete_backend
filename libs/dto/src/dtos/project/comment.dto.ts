import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDate,
} from 'class-validator';

// DTO for creating a comment
export class CreateCommentDto {

  createdBy?: string;

  @ApiProperty({
    description: 'The message of the comment',
    example: 'This is a comment on the task.',
    required: true,
  })
  @IsString()
  message: string;

  @ApiPropertyOptional({
    description: 'Optional document related to the comment',
    example: 'document-url-or-id',
    required: false,
  })
  @IsOptional()
  @IsString()
  doc?: string;

  @ApiProperty({
    description: 'The unique identifier of the task associated with the comment',
    example: '605c72ef7c1b2c001f64f4f4',
  })
  @IsMongoId()
  @IsNotEmpty()
  taskId: string;
}

// DTO for updating a comment
export class UpdateCommentDto {
  @ApiPropertyOptional({
    description: 'The unique identifier of the user who created the comment',
    example: '605c72ef7c1b2c001f64f4f3',
    required: false,
  })
  @IsOptional()
  @IsMongoId()
  createdBy?: string; // MongoDB ObjectId referencing `User`

  @ApiPropertyOptional({
    description: 'The message of the comment',
    example: 'Updated comment text.',
    required: false,
  })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiPropertyOptional({
    description: 'The date and time when the comment was updated',
    example: '2024-08-05T12:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDate()
  time?: Date;

  @ApiPropertyOptional({
    description: 'Optional document related to the comment',
    example: 'updated-document-url-or-id',
    required: false,
  })
  @IsOptional()
  @IsString()
  doc?: string;

  @ApiPropertyOptional({
    description:
      'The unique identifier of the task associated with the comment',
    example: '605c72ef7c1b2c001f64f4f4',
    required: false,
  })
  @IsOptional()
  @IsMongoId()
  taskId?: string; // MongoDB ObjectId referencing `Tasks`
}
