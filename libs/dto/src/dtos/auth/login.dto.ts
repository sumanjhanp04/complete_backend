// Import validation decorators from class-validator
// These decorators validate incoming request data before it reaches the controller/service.
import { IsNotEmpty, IsString, IsEmail } from 'class-validator';

// Import Swagger decorator
// Used to automatically generate API documentation in Swagger UI.
import { ApiProperty } from '@nestjs/swagger';

/**
 * LoginDto
 *
 * DTO = Data Transfer Object
 *
 * Purpose:
 * This DTO is used when a user tries to log in to the system.
 *
 * It defines:
 * 1. What data the frontend must send.
 * 2. Validation rules for the data.
 * 3. Swagger API documentation.
 *
 * Example Request:
 *
 * {
 *   "username": "johndoe",
 *   "password": "StrongPassword!23"
 * }
 *
 * Flow:
 *
 * Frontend
 *    ↓
 * LoginDto Validation
 *    ↓
 * Controller
 *    ↓
 * Authentication Service
 *    ↓
 * Database Verification
 *    ↓
 * JWT Token Generation
 */
export class LoginDto {
  /**
   * Username Field
   *
   * Swagger Documentation:
   * Displays this field in Swagger UI.
   */
  @ApiProperty({
    description: 'The username of the user',
    example: 'johndoe',
  })

  /**
   * Validation:
   * Username cannot be empty.
   *
   * Valid:
   * "johndoe"
   *
   * Invalid:
   * ""
   * null
   * undefined
   */
  @IsNotEmpty()

  /**
   * Validation:
   * Username must be a string.
   *
   * Valid:
   * "johndoe"
   *
   * Invalid:
   * 12345
   * true
   * {}
   */
  @IsString()

  /**
   * Stores the username entered by the user.
   *
   * Example:
   * "johndoe"
   */
  username: string;

  /**
   * Password Field
   *
   * Swagger Documentation:
   * Displays this field in Swagger UI.
   */
  @ApiProperty({
    description: 'The password of the user',
    example: 'StrongPassword!23',
  })

  /**
   * Validation:
   * Password cannot be empty.
   *
   * Valid:
   * "StrongPassword!23"
   *
   * Invalid:
   * ""
   * null
   * undefined
   */
  @IsNotEmpty()

  /**
   * Validation:
   * Password must be a string.
   *
   * Valid:
   * "StrongPassword!23"
   *
   * Invalid:
   * 12345
   * true
   * {}
   */
  @IsString()

  /**
   * Stores the user's password.
   *
   * Note:
   * The password received here is usually plain text.
   * The service will compare it with the hashed password
   * stored in the database.
   */
  password: string;
}
