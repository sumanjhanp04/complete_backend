import { PartialType } from '@nestjs/mapped-types';
import { IsNotEmpty, IsEmail, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ClientDto {
  @ApiProperty({
    description: 'The first name of the client',
    example: 'John',
  })
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @ApiPropertyOptional({
    description: 'The last name of the client',
    example: 'Doe',
  })
  @IsString()
  lastName?: string;

  @ApiProperty({
    description: 'The email address of the client',
    example: 'john.doe@example.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    description: 'A secondary email address for the client',
    example: 'john.doe.secondary@example.com',
  })
  secondaryEmail?: string;

  @ApiProperty({
    description: 'The mobile number of the client',
    example: '+1234567890',
  })
  @IsNotEmpty()
  @IsString()
  mobile: string;

  @ApiPropertyOptional({
    description: 'A secondary mobile number for the client',
    example: '+0987654321',
  })
  secondaryMobile?: string;

  @ApiPropertyOptional({
    description: 'The address of the client',
    example: '123 Main Street, Anytown',
  })
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    description: 'The country of the client',
    example: 'USA',
  })
  @IsString()
  country?: string;

  @ApiProperty({
    description: 'The company name of the client',
    example: 'Acme Corp',
  })
  @IsNotEmpty()
  @IsString()
  company: string;



  createdBy?: string;
  updatedBy?: string;
}

export class UpdateClientDto extends PartialType(ClientDto) {
  @ApiPropertyOptional({
    description: "The URL of the client's profile image",
    example: 'https://example.com/images/profile.jpg',
  })
  image?: string;
}
