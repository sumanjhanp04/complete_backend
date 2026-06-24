// Swagger Documentation
import { ApiProperty } from '@nestjs/swagger';

// Validation Decorators
import {
  IsString,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsOptional,
} from 'class-validator';

// Used for nested DTO transformation
import { Type } from 'class-transformer';

/**
 * Shared User DTO
 *
 * Represents a user who can access
 * the stored credentials.
 */
class SharedWithDto {
  /**
   * User ID
   *
   * User who gets access
   */
  @ApiProperty({
    description: 'User ID of the shared user',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  /**
   * Access Permission
   *
   * Example:
   * read
   * write
   * admin
   */
  @ApiProperty({
    description: 'Access level granted to the user',
  })
  @IsString()
  @IsNotEmpty()
  accessLevel: string;
}

/**
 * Main DTO
 *
 * Used while creating account credentials.
 */
export class CreateAccountCredentialsDto {
  /**
   * Parent Credential ID
   *
   * Reference to Credentials Collection
   */
  @ApiProperty({
    description: 'Reference to the Credentials table',
  })
  @IsString()
  @IsNotEmpty()
  credentialsId: string;

  /**
   * Username
   *
   * Example:
   * admin@gmail.com
   * github_username
   */
  @ApiProperty({
    description: 'Username for the account',
  })
  @IsString()
  @IsNotEmpty()
  username: string;

  /**
   * Password
   *
   * Account Password
   */
  @ApiProperty({
    description: 'Password for the account',
  })
  @IsString()
  @IsNotEmpty()
  password: string;

  /**
   * Additional Notes
   *
   * Optional
   */
  @ApiProperty({
    description: 'note',
  })
  @IsString()
  @IsOptional()
  note: string;

  /**
   * Users with Access
   *
   * Optional Array
   */
  @ApiProperty({
    description: 'List of users with access',
    type: [SharedWithDto],
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  // Validate every object in array
  @Type(() => SharedWithDto)
  // Convert JSON -> SharedWithDto object
  sharedWith?: SharedWithDto[];
}
