// Swagger documentation
import { ApiProperty } from '@nestjs/swagger';

// Validation decorators
import { IsString, IsNotEmpty } from 'class-validator';


/**
 * DTO for updating account password
 *
 * Used when changing an existing password.
 */
export class UpdateAccountCredentialPasswordDto {

  /**
   * Current Password
   *
   * User must provide the existing password
   * before changing it.
   */
  @ApiProperty({
    description: 'Old password of the account',
  })
  @IsString()
  @IsNotEmpty()
  oldPassword: string;


  /**
   * New Password
   *
   * Password that will replace
   * the existing password.
   */
  @ApiProperty({
    description: 'New password for the account',
  })
  @IsString()
  @IsNotEmpty()
  newPassword: string;
}