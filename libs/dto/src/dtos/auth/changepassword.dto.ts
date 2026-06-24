// Import validation decorators from class-validator
// These decorators validate incoming request data before it reaches the controller/service.
import { IsNotEmpty, IsString } from 'class-validator';

// Import Swagger decorators
// These decorators are used to generate API documentation automatically.
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * ChangePasswordDto
 *
 * DTO = Data Transfer Object
 *
 * Purpose:
 * This DTO is used when a user wants to change their password.
 *
 * Request Example:
 *
 * {
 *   "password": "NewStrongPassword!23",
 *   "oldPassword": "OldWeakPassword!23"
 * }
 *
 * Flow:
 * Frontend
 *    ↓
 * ChangePasswordDto Validation
 *    ↓
 * Controller
 *    ↓
 * Service
 *    ↓
 * Database
 */
export class ChangePasswordDto {
  /**
   * New Password
   *
   * Swagger Documentation:
   * Shows this field in Swagger UI with description and example.
   */
  @ApiProperty({
    description: 'The new password of the user',
    example: 'NewStrongPassword!23',
  })

  /**
   * Validation:
   * Ensures the field is not empty.
   *
   * Valid:
   * "NewPassword123"
   *
   * Invalid:
   * ""
   * null
   * undefined
   */
  @IsNotEmpty()

  /**
   * Validation:
   * Ensures the value must be a string.
   *
   * Valid:
   * "NewPassword123"
   *
   * Invalid:
   * 12345
   * true
   * {}
   */
  @IsString()

  /**
   * Stores the user's new password.
   */
  password: string;

  /**
   * Old Password
   *
   * Swagger Documentation:
   * Displays this field in Swagger UI.
   */
  @ApiProperty({
    description: 'The old password of the user',
    example: 'OldWeakPassword!23',
  })

  /**
   * Validation:
   * Old password cannot be empty.
   */
  @IsNotEmpty()

  /**
   * Validation:
   * Old password must be a string.
   */
  @IsString()

  /**
   * Stores the user's current password.
   *
   * This is used to verify that the user knows
   * their existing password before allowing a change.
   */
  oldPassword: string;

  /**
   * User ID
   *
   * Usually this field is added by the backend
   * after authentication.
   *
   * Example:
   * req.user.id from JWT token.
   *
   * Since there are no validation decorators,
   * this field is optional.
   *
   * Example Value:
   * "685a9d8e12a34b56c78d90ef"
   */
  user?: string;
}
