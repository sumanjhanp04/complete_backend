import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { AddAddressDto } from './address.dto';

export class AddEmployeeDto {
  @ApiProperty({
    description: 'The first name of the employee',
    example: 'John',
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    description: 'The last name of the employee',
    example: 'Doe',
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    description: 'The mobile number of the employee',
    example: '+1234567890',
  })
  @IsString()
  @IsNotEmpty()
  mobile: string;

  @ApiProperty({
    description: 'The email address of the employee',
    example: 'john.doe@example.com',
  })
  @IsString()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'The unique identifier for the employee',
    example: 'EMP123',
  })
  @ApiPropertyOptional({
    description: 'Is the Employee a Manager?',
    example: true, // example set as true (can be false as well)
  })
  @IsOptional()
  @IsBoolean()
  isManager?: boolean;
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @ApiProperty({
    description: 'The date the employee joined',
    example: '2024-01-15',
  })
  @IsNotEmpty()
  dateJoined: string;

  @ApiProperty({
    description: 'The role of the employee within the company',
    example: 'Employee',
  })
  @IsString()
  @IsNotEmpty()
  role: string;

  @ApiPropertyOptional({
    description: 'The gender of the employee',
    example: 'Male',
  })
  @IsString()
  gender: string;

  @ApiPropertyOptional({
    description: 'The designation of the employee',
    example: 'IT Department',
  })
  @IsString()
  department: string;

  @ApiPropertyOptional({
    description: 'The designation of the employee',
    example: 'Senior Developer',
  })
  @IsOptional()
  @IsString()
  designation: string;

  @ApiProperty({
    description: 'The date of birth of the employee',
    example: '1990-05-10',
  })
  @IsNotEmpty()
  dob: string;

  @ApiPropertyOptional({
    description: 'The person the employee reports to',
    example: 'Jane Smith',
  })
  @IsOptional()
  @IsString()
  reportsTo?: string;
}

export class UpdateEmployeeDto extends PartialType(AddEmployeeDto) {

  @ApiProperty({
    description: 'The unique identifier for the employee',
    example: 'EMP123',
  })
  @IsNotEmpty()
  employeeId: string;


  @ApiPropertyOptional({
    description: 'The first name of the employee',
    example: 'John',
  })
  @IsOptional()
  @IsString()
  firstName?: string;


  @ApiPropertyOptional({
    description: 'The last name of the employee',
    example: 'Doe',
  })
  @IsOptional()
  @IsString()
  lastName?: string;


  @ApiPropertyOptional({
    description: 'The role of the employee within the company',
    example: 'Software Engineer',
  })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({
    description: 'The designation of the employee',
    example: 'Senior Developer',
  })
  @IsOptional()
  @IsString()
  designation?: string;


  @ApiPropertyOptional({
    description: 'The gender of the employee',
    example: 'Male',
  })
  @IsOptional()
  @IsString()
  gender?: string;


  @ApiPropertyOptional({
    description: 'Is the Employee a Manager?',
    example: true, // example set as true (can be false as well)
  })
  @IsOptional()
  @IsBoolean()
  isManager?: boolean;


  @ApiPropertyOptional({
    description: 'The person the employee reports to',
    example: 'Jane Smith',
  })
  @IsOptional()
  @IsString()
  reportsTo?: string;


  @ApiPropertyOptional({
    description: "The URL of the employee's image",
    example: 'https://www.example.com/images/john_doe.jpg',
  })
  @IsOptional()
  @IsString()
  image?: string;


  @IsOptional()
  @IsString()
  banner?: string;

  @IsOptional()
  @IsString()
  dateJoined?: string;
}
export class EmployeeAddressDto {
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
  @IsBoolean()
  @IsOptional()
  sameAsPermanentAddress?: boolean;
}
