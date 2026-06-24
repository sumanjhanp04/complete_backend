// Validation decorators
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

// Convert plain JSON to DTO objects
import { Type } from 'class-transformer';

// Swagger Documentation
import { ApiProperty } from '@nestjs/swagger';

/**
 * Shared User DTO
 *
 * Represents a user who can access
 * the uploaded file.
 */
class SharedWithDto {
  /**
   * User ID
   *
   * MongoDB User ObjectId
   */
  @ApiProperty({
    description: 'The ID of the user to share the file with',
    type: String,
    example: '675a80724914646669719555',
  })
  @IsString()
  userId: string;

  /**
   * Access Level
   *
   * Allowed:
   * read
   * write
   */
  @ApiProperty({
    description: 'Access level for the shared user',
    type: String,
    enum: ['read', 'write'],
    example: 'write',
  })
  @IsString()
  @IsEnum(['read', 'write'], {
    message: 'Access level must be either read or write',
  })
  accessLevel: string;
}

/**
 * Update File Credential DTO
 *
 * Used for:
 *
 * PATCH /file-credentials/:id
 */
export class UpdateFileCredentialDto {
  /**
   * Shared Users
   *
   * Updates file permissions.
   */
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SharedWithDto)
  sharedWith?: SharedWithDto[];
}
