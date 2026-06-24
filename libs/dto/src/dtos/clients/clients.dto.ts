// PartialType helps create Update DTO automatically
// by making all properties optional.
import { PartialType } from '@nestjs/mapped-types';

// Validation decorators
import { IsNotEmpty, IsEmail, IsString } from 'class-validator';

// Swagger decorators
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * CLIENT DTO
 *
 * Used while creating a new client.
 *
 * POST /clients
 */
export class ClientDto {
  /**
   * First Name
   *
   * Required Field
   */
  @ApiProperty({
    description: 'The first name of the client',
    example: 'John',
  })
  @IsNotEmpty()
  @IsString()
  firstName: string;

  /**
   * Last Name
   *
   * Optional Field
   */
  @ApiPropertyOptional({
    description: 'The last name of the client',
    example: 'Doe',
  })
  @IsString()
  lastName?: string;

  /**
   * Email
   *
   * Required Field
   * Must be valid email format
   */
  @ApiProperty({
    description: 'The email address of the client',
    example: 'john.doe@example.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  /**
   * Secondary Email
   *
   * Optional Field
   */
  @ApiPropertyOptional({
    description: 'A secondary email address for the client',
    example: 'john.doe.secondary@example.com',
  })
  secondaryEmail?: string;

  /**
   * Mobile Number
   *
   * Required Field
   */
  @ApiProperty({
    description: 'The mobile number of the client',
    example: '+1234567890',
  })
  @IsNotEmpty()
  @IsString()
  mobile: string;

  /**
   * Secondary Mobile
   *
   * Optional Field
   */
  @ApiPropertyOptional({
    description: 'A secondary mobile number for the client',
    example: '+0987654321',
  })
  secondaryMobile?: string;

  /**
   * Address
   *
   * Optional Field
   */
  @ApiPropertyOptional({
    description: 'The address of the client',
    example: '123 Main Street, Anytown',
  })
  @IsString()
  address?: string;

  /**
   * Country
   *
   * Optional Field
   */
  @ApiPropertyOptional({
    description: 'The country of the client',
    example: 'USA',
  })
  @IsString()
  country?: string;

  /**
   * Company Name
   *
   * Required Field
   */
  @ApiProperty({
    description: 'The company name of the client',
    example: 'Acme Corp',
  })
  @IsNotEmpty()
  @IsString()
  company: string;

  /**
   * Internal Fields
   *
   * Usually added by backend
   * from logged-in user details
   *
   * Not expected from frontend
   */
  createdBy?: string;
  updatedBy?: string;
}

/**
 * UPDATE CLIENT DTO
 *
 * Used for:
 *
 * PATCH /clients/:id
 * PUT /clients/:id
 */
export class UpdateClientDto extends PartialType(ClientDto) {
  /**
   * Profile Image URL
   *
   * Additional field available only
   * during update operation.
   */
  @ApiPropertyOptional({
    description: "The URL of the client's profile image",
    example: 'https://example.com/images/profile.jpg',
  })
  image?: string;
}
