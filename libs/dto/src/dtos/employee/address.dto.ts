import {   IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddAddressDto {
  
  @ApiProperty({
    description: 'The address of the contact',
    example: '123 Main Street',
  })
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiPropertyOptional({
    description: 'A landmark near the address',
    example: 'Near Central Park',
  })
  @IsOptional()
  @IsString()
  landmark?: string;

  @ApiProperty({ description: 'The city of the address', example: 'New York' })
  @IsNotEmpty()
  @IsString()
  city: string;

  @ApiProperty({ description: 'The state of the address', example: 'NY' })
  @IsNotEmpty()
  @IsString()
  state: string;

  @ApiProperty({ description: 'The pin code of the address', example: '10001' })
  @IsNotEmpty()
  @IsString()
  pinCode: string;

  @ApiProperty({ description: 'The country of the address', example: 'USA' })
  @IsNotEmpty()
  @IsString()
  country: string;
 
}
