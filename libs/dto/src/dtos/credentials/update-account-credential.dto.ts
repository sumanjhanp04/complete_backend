import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsArray,
  IsOptional,
  ValidateNested,
  // IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

class SharedWithDto {
  @ApiProperty({ description: 'User ID of the shared user' })
  @IsString()
  userId: string;

  @ApiProperty({
    description: 'Access level granted to the user',
    default: false,
  })
  @IsString()
  accessLevel: string;
}

export class UpdateAccountCredentialsDto {
  @ApiProperty({
    description: 'Reference to the Credentials table',
    required: false,
  })
  @IsString()
  @IsOptional()
  credentialsId?: string;

  @ApiProperty({ description: 'Username for the account', required: false })
  @IsString()
  @IsOptional()
  username?: string;

  @ApiProperty({ description: 'Password for the account', required: false })
  @IsString()
  @IsOptional()
  password?: string;
  @ApiProperty({ description: 'note' })
  @IsString()
  @IsOptional()
  note: string;
  @ApiProperty({
    description: 'List of users with access',
    type: [SharedWithDto],
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SharedWithDto)
  @IsOptional()
  sharedWith?: SharedWithDto[];
}
