// Validation decorators
import { IsString, IsArray, IsOptional, ValidateNested } from 'class-validator';

// Swagger Documentation
import { ApiProperty } from '@nestjs/swagger';

// Database Schema (currently unused)
import { AccountCredentials } from '@lib/database/schemas/credentials/account-credentials.schema';

// Used for nested DTO conversion
import { Type } from 'class-transformer';

/**
 * Shared User DTO
 *
 * Defines users who have access
 * to the credential.
 */
class SharedWithDto {
  /**
   * User ID
   */
  @ApiProperty({
    description: 'User ID of the shared user',
    required: false,
  })
  @IsString()
  @IsOptional()
  userId?: string;

  /**
   * Access Permission
   *
   * Example:
   * read
   * write
   */
  @ApiProperty({
    description: 'Access level granted to the user',
    required: false,
  })
  @IsString()
  @IsOptional()
  accessLevel?: string;
}

/**
 * Update Credential DTO
 *
 * Used for:
 *
 * PATCH /credentials/:id
 */
export class UpdateCredentialsDto {
  /**
   * Credential Name
   *
   * Example:
   * Google
   * AWS
   * GitHub
   */
  @ApiProperty({
    description: 'The name of the credential (e.g., Google, Facebook)',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  /**
   * Credential Description
   */
  @ApiProperty({
    description: 'The description of the credential',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  /**
   * Credential URL
   */
  @ApiProperty({
    description: 'The URL associated with the credential',
    required: false,
  })
  @IsString()
  @IsOptional()
  url?: string;

  /**
   * Shared Users
   */
  @ApiProperty({
    description: 'List of users with whom the credential is shared',
    type: [SharedWithDto],
    required: false,
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SharedWithDto)
  sharedWith?: SharedWithDto[];
}
