// user.dto.ts

// Import user type constants from database library.
// USER_TYPES -> Array of allowed user types.
// USER_TYPE_MAP -> Object containing predefined user type values.
import { USER_TYPE_MAP, USER_TYPES } from '@lib/database';

// Import validation decorators from class-validator.
// These decorators validate incoming request data automatically.
import {
  IsNotEmpty,
  IsEnum,
  IsBoolean,
  IsString,
  IsNumber,
} from 'class-validator';

// Import Swagger decorators.
// Used to generate API documentation automatically.
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * ============================================================================
 * UserDto
 * ============================================================================
 *
 * Purpose:
 * Used when creating a new user.
 *
 * Example Request:
 *
 * {
 *   "userId": "1234567890",
 *   "userIdRef": "CLIENT",
 *   "userType": "CLIENT",
 *   "password": "StrongPassword!23",
 *   "wantReset": false,
 *   "status": true,
 *   "allocatedSpace": 500
 * }
 *
 * Flow:
 *
 * Frontend
 *    ↓
 * UserDto Validation
 *    ↓
 * Controller
 *    ↓
 * Service
 *    ↓
 * Database
 *
 */

export class UserDto {
  /**
   * Unique identifier of the user.
   *
   * Example:
   * "1234567890"
   */
  @ApiProperty({
    description: 'The unique identifier of the user',
    example: '1234567890',
  })
  @IsNotEmpty()
  userId: string;

  /**
   * Reference type of the user.
   *
   * Example:
   * CLIENT
   * EMPLOYEE
   * ADMIN
   *
   * Validation:
   * Must match one of the values present in USER_TYPES.
   */
  @ApiProperty({
    enum: USER_TYPES,
    description: 'The reference ID of the user type',
    example: USER_TYPE_MAP.CLIENT,
  })
  @IsNotEmpty()
  @IsEnum(USER_TYPES)
  userIdRef: string;

  /**
   * User role/category.
   *
   * Example:
   * CLIENT
   * EMPLOYEE
   * ADMIN
   */
  @ApiProperty({
    enum: USER_TYPES,
    description: 'The type of the user',
    example: USER_TYPE_MAP.CLIENT,
  })
  @IsNotEmpty()
  @IsEnum(USER_TYPES)
  userType: string;

  /**
   * User password.
   *
   * Example:
   * "StrongPassword!23"
   *
   * Validation:
   * Cannot be empty.
   * Must be a string.
   *
   * Usually hashed using bcrypt before saving to database.
   */
  @ApiProperty({
    description: 'The password of the user',
    example: 'StrongPassword!23',
  })
  @IsNotEmpty()
  @IsString()
  password: string;

  /**
   * Indicates whether user has requested password reset.
   *
   * Example:
   * false
   */
  @ApiPropertyOptional({
    description: 'Indicates if the user wants to reset their password',
    example: false,
  })
  @IsBoolean()
  wantReset?: boolean;

  /**
   * Secret key/token.
   *
   * Used for:
   * - Password reset
   * - Verification
   * - Security operations
   */
  @ApiPropertyOptional({
    description: 'The secret key for the user',
    example: 'user-secret-key',
  })
  secret?: string;

  /**
   * User account status.
   *
   * true  = Active
   * false = Inactive
   */
  @ApiPropertyOptional({
    description: 'The status of the user',
    example: true,
  })
  @IsBoolean()
  status?: boolean;

  /**
   * Allocated storage space.
   *
   * Example:
   * 500
   *
   * Unit depends on business logic.
   * (MB / GB)
   */
  @ApiPropertyOptional({
    description: 'The status of the allocated space',
    example: '500mb',
  })
  @IsNumber()
  allocatedSpace?: number;
}

/**
 * ============================================================================
 * UpdateUserDto
 * ============================================================================
 *
 * Purpose:
 * Used when updating an existing user.
 *
 * Difference:
 * UserDto -> Create User
 * UpdateUserDto -> Update Existing User
 *
 * All fields are optional because user may update
 * only a few properties.
 *
 * Example:
 *
 * {
 *   "status": false,
 *   "workfromhome": true
 * }
 *
 */

export class UpdateUserDto {
  /**
   * User unique identifier.
   */
  @ApiPropertyOptional({
    description: 'The unique identifier of the user',
    example: '1234567890',
  })
  userId?: string;

  /**
   * User reference type.
   */
  @ApiPropertyOptional({
    enum: USER_TYPES,
    description: 'The reference ID of the user type',
    example: USER_TYPE_MAP.CLIENT,
  })
  @IsEnum(USER_TYPES)
  userIdRef?: string;

  /**
   * User role/category.
   */
  @ApiPropertyOptional({
    enum: USER_TYPES,
    description: 'The type of the user',
    example: USER_TYPE_MAP.CLIENT,
  })
  @IsEnum(USER_TYPES)
  userType?: string;

  /**
   * Indicates whether user is a manager.
   *
   * Example:
   * true
   */
  @ApiPropertyOptional({
    description: 'Indicates if the user is a manager',
    example: true,
  })
  @IsBoolean()
  isManager?: boolean;

  /**
   * Users assigned under this user.
   *
   * Example:
   * ["user1", "user2"]
   *
   * Useful for managers/team leads.
   */
  @ApiPropertyOptional({
    type: [String],
    description: 'The list of users assigned to this user',
    example: ['user1', 'user2'],
  })
  assignedUsers?: string[];

  /**
   * Indicates whether user works remotely.
   *
   * true = Work From Home
   * false = Office
   */
  @ApiPropertyOptional({
    description: 'Indicates if the user is working from home',
    example: true,
  })
  @IsBoolean()
  workfromhome?: boolean;

  /**
   * Password reset flag.
   */
  @ApiPropertyOptional({
    description: 'Indicates if the user wants to reset their password',
    example: true,
  })
  @IsBoolean()
  wantReset?: boolean;

  /**
   * Secret key/token.
   */
  @ApiPropertyOptional({
    description: 'The secret key for the user',
    example: 'user-secret-key',
  })
  secret?: string;

  /**
   * Employee shift.
   *
   * Example:
   * Morning
   * Evening
   * Night
   */
  @ApiPropertyOptional({
    description: 'The shift assigned to the user',
    example: 'Morning Shift',
  })
  shift?: string;

  /**
   * User account status.
   *
   * true = Active
   * false = Inactive
   */
  @ApiPropertyOptional({
    description: 'The status of the user',
    example: true,
  })
  @IsBoolean()
  status?: boolean;

  /**
   * Allocated storage space.
   *
   * Example:
   * 500
   */
  @ApiPropertyOptional({
    description: 'The status of the allocated space',
    example: '500mb',
  })
  @IsNumber()
  allocatedSpace?: number;
}
