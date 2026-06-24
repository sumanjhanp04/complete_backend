// Swagger decorators
import { ApiProperty, PartialType } from '@nestjs/swagger';

// Validation decorators
import { IsNotEmpty, IsOptional, IsString, IsEmail } from 'class-validator';

/**
 * COMPANY DTO
 *
 * Used when creating a company.
 *
 * POST /company
 */
export class CompanyDto {
  /**
   * Company Name
   *
   * Required
   */
  @ApiProperty({
    description: 'The name of the company',
    example: 'Acme Corp',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  /**
   * Company Address
   *
   * Required
   */
  @ApiProperty({
    description: 'The address of the company',
    example: '123 Main St, Springfield',
  })
  @IsNotEmpty()
  @IsString()
  address: string;

  /**
   * Company Website
   *
   * Optional
   */
  @ApiProperty({
    description: 'The website of the company',
    example: 'https://www.acmecorp.com',
    required: false,
  })
  @IsOptional()
  @IsString()
  website?: string;

  /**
   * Company Email
   *
   * Optional
   * Must be valid email format
   */
  @ApiProperty({
    description: 'The email address of the company',
    example: 'contact@acmecorp.com',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  /**
   * Company Mobile Number
   *
   * Optional
   */
  @ApiProperty({
    description: 'The mobile phone number of the company',
    example: '+1234567890',
    required: false,
  })
  @IsOptional()
  @IsString()
  mobile?: string;
}

/**
 * UPDATE COMPANY DTO
 *
 * Used for:
 *
 * PATCH /company/:id
 * PUT /company/:id
 */
export class UpdateCompanyDto extends PartialType(CompanyDto) {
  /**
   * All fields below become optional.
   *
   * PartialType already makes them optional,
   * but they are redefined here mainly for
   * Swagger documentation customization.
   */

  @ApiProperty({
    description: 'The name of the company',
    example: 'Acme Corp',
    required: false,
  })
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'The address of the company',
    example: '123 Main St, Springfield',
    required: false,
  })
  @IsOptional()
  address?: string;

  @ApiProperty({
    description: 'The website of the company',
    example: 'https://www.acmecorp.com',
    required: false,
  })
  @IsOptional()
  website?: string;

  @ApiProperty({
    description: 'The email address of the company',
    example: 'contact@acmecorp.com',
    required: false,
  })
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'The mobile phone number of the company',
    example: '+1234567890',
    required: false,
  })
  @IsOptional()
  mobile?: string;
}
