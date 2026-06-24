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
 * Defines users who can access
 * the credential.
 */
class SharedWithDto {
  /**
   * User ID
   */
  @ApiProperty({
    description: 'User ID of the shared user',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  /**
   * Permission Level
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
 * Create Credential DTO
 *
 * Creates a credential/service entry.
 */
export class CreateCredentialsDto {
  /**
   * Service Name
   *
   * Example:
   * GitHub
   * AWS
   * Gmail
   * Hostinger
   */
  @ApiProperty({
    description: 'Service name',
  })
  @IsString()
  name: string;

  /**
   * Service Description
   *
   * Optional
   */
  @ApiProperty({
    description: 'Service description',
  })
  @IsString()
  @IsOptional()
  description?: string;

  /**
   * Service URL
   *
   * Example:
   * https://github.com
   * https://aws.amazon.com
   */
  @ApiProperty({
    description: 'Service URL',
  })
  @IsString()
  url: string;

  /**
   * Users Who Can Access
   *
   * Optional Array
   */
  @ApiProperty({
    description: 'List of users with whom the credential is shared',
    type: [SharedWithDto],
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SharedWithDto)
  sharedWith?: SharedWithDto[];
}
