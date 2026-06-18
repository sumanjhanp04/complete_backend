import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class UpdateAccountCredentialPasswordDto {
  @ApiProperty({ description: 'Old password of the account' })
  @IsString()
  @IsNotEmpty()
  oldPassword: string;

  @ApiProperty({ description: 'New password for the account' })
  @IsString()
  @IsNotEmpty()
  newPassword: string;
}
