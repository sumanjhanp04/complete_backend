import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
class SharedWithDto {
  @ApiProperty({ description: 'User ID of the shared user' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'Access level granted to the user' })
  @IsString()
  @IsNotEmpty()
  accessLevel: string;
}
export class CreateCredentialsDto {

  @ApiProperty({ description: 'Service name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Service description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Service URL' })
  @IsString()
  url: string;

  @ApiProperty({
    description: 'List of users with whom the credential is shared',
    type: [SharedWithDto], // Specify the type explicitly for Swagger
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SharedWithDto)
  sharedWith?: SharedWithDto[];
}
