import {
  IsString,
  IsArray,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AccountCredentials } from '@lib/database/schemas/credentials/account-credentials.schema';
import { Type } from 'class-transformer';

class SharedWithDto {
  @ApiProperty({ description: 'User ID of the shared user', required: false })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiProperty({
    description: 'Access level granted to the user',
    required: false,
  })
  @IsString()
  @IsOptional()
  accessLevel?: string;
}

export class UpdateCredentialsDto {
  @ApiProperty({
    description: 'The name of the credential (e.g., Google, Facebook)',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'The description of the credential',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'The URL associated with the credential',
    required: false,
  })
  @IsString()
  @IsOptional()
  url?: string;

  @ApiProperty({
    description: 'List of users with whom the credential is shared',
    type: [SharedWithDto],
    required: false,
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SharedWithDto)
  sharedWith?: SharedWithDto[];

  // @ApiProperty({
  //   description: 'Account credentials for the credential',
  //   type: AccountCredentials,
  //   required: false,
  // })
  // @ValidateNested()
  // @IsOptional()
  // @Type(() => AccountCredentials)
  // accountCredentials?: AccountCredentials;
}
