import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'The new password of the user',
    example: 'NewStrongPassword!23',
  })
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiProperty({
    description: 'The old password of the user',
    example: 'OldWeakPassword!23',
  })
  @IsNotEmpty()
  @IsString()
  oldPassword: string;

  user?: string;
}
