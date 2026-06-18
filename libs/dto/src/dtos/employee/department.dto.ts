import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AddDesignationDto {
  @ApiProperty({
    description: 'The name of the designation',
    example: 'Software Engineer',
  })
  @IsString()
  @IsNotEmpty()
  designationName: string;

  @ApiProperty({
    description: 'The department to which the designation belongs',
    example: 'Engineering',
  })
  @IsString()
  @IsNotEmpty()
  department: string;
}

export class AddDepartmentDto {
  @ApiProperty({
    description: 'The name of the department',
    example: 'Developer',
  })
  @IsString()
  @IsNotEmpty()
  departmentName: string;
}
