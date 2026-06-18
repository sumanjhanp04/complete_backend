import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsOptional,
} from 'class-validator';
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

export class CreateAccountCredentialsDto {
  @ApiProperty({ description: 'Reference to the Credentials table' })
  @IsString()
  @IsNotEmpty()
  credentialsId: string;

  @ApiProperty({ description: 'Username for the account' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ description: 'Password for the account' })
  @IsString()
  @IsNotEmpty()
  password: string;
  @ApiProperty({ description: 'note' })
  @IsString()
  @IsOptional()
  note: string;

  @ApiProperty({
    description: 'List of users with access',
    type: [SharedWithDto],
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SharedWithDto)
  sharedWith?: SharedWithDto[];
}
