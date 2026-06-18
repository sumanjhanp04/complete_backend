import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsEmail } from 'class-validator';

export class CompanyDto {
  @ApiProperty({
    description: 'The name of the company',
    example: 'Acme Corp',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'The address of the company',
    example: '123 Main St, Springfield',
  })
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiProperty({
    description: 'The website of the company',
    example: 'https://www.acmecorp.com',
    required: false,
  })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiProperty({
    description: 'The email address of the company',
    example: 'contact@acmecorp.com',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    description: 'The mobile phone number of the company',
    example: '+1234567890',
    required: false,
  })
  @IsOptional()
  @IsString()
  mobile?: string;
}

export class UpdateCompanyDto extends PartialType(CompanyDto) {
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
