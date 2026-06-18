import {
  IsString,
  IsOptional,
  IsEmail,
  IsBoolean,
  IsArray,
  IsNotEmpty,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AddAddressDto } from './address.dto';
import { PartialType } from '@nestjs/mapped-types';

export class AddEmergencyContactDto {
  @ApiProperty({
    description: 'Name of the emergency contact',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Relation to the employee', example: 'Brother' })
  @IsString()
  @IsNotEmpty()
  relation: string;

  @ApiProperty({
    description: 'Primary mobile number of the contact',
    example: '+1234567890',
  })
  @IsString()
  @IsNotEmpty()
  primaryMobile: string;

  @ApiPropertyOptional({
    description: 'Secondary mobile numbers',
    example: ['+0987654321'],
  })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  secondaryMobile?: string[];

  @ApiProperty({
    description: 'Primary email of the contact',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  primaryEmail: string;

  @ApiPropertyOptional({
    description: 'Secondary email addresses',
    example: ['john.secondary@example.com'],
  })
  @IsArray()
  @IsOptional()
  @IsEmail({}, { each: true })
  secondaryEmail?: string[];

  @ApiProperty({
    description: 'Permanent address of the contact',
    type: AddAddressDto,
  })
  @IsObject()
  @IsOptional()
  permanentAddress?: AddAddressDto;

  @ApiPropertyOptional({
    description: 'Current address of the contact',
    type: AddAddressDto,
  })
  @IsObject()
  @IsOptional()
  currentAddress?: AddAddressDto;

  @ApiPropertyOptional({
    description:
      'Flag indicating if the current address is the same as the permanent address',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  sameAsPermanentAddress?: boolean;
}
export class UpdateEmergencyContactInfoDto extends PartialType(
  AddEmergencyContactDto,
) {}