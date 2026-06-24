// Import Swagger decorator.
// Used to generate API documentation automatically.
import { ApiProperty } from '@nestjs/swagger';

// Import validation decorators.
// These decorators validate incoming request data before it reaches the controller.
import { IsMongoId, IsNotEmpty } from 'class-validator';

/**
 * ============================================================================
 * UserStatusChangeDTO
 * ============================================================================
 *
 * Purpose:
 * Used when changing a user's status.
 *
 * Example Use Cases:
 * - Activate User
 * - Deactivate User
 * - Enable Account
 * - Disable Account
 *
 * Example Request:
 *
 * {
 *   "userId": "661bbc6a9de2e97683d0089c"
 * }
 *
 * Flow:
 *
 * Frontend
 *    ↓
 * UserStatusChangeDTO Validation
 *    ↓
 * Controller
 *    ↓
 * Service
 *    ↓
 * User Status Updated
 */

export class UserStatusChangeDTO {
  /**
   * User ID
   *
   * Stores the MongoDB ObjectId of the user
   * whose status will be changed.
   *
   * Example:
   * "661bbc6a9de2e97683d0089c"
   *
   * Validation:
   * - Cannot be empty
   * - Must be a valid MongoDB ObjectId
   */

  @IsNotEmpty()

  /**
   * Checks whether the provided value
   * is a valid MongoDB ObjectId.
   *
   * Valid:
   * 661bbc6a9de2e97683d0089c
   *
   * Invalid:
   * abc123
   */
  @IsMongoId()

  /**
   * Swagger documentation.
   *
   * This field appears in Swagger UI.
   */
  @ApiProperty({
    example: '661bbc6a9de2e97683d0089c',
    description: 'The id of the user to be taken action on',
  })
  userId: string;
}

/**
 * ============================================================================
 * UserShiftChangeDto
 * ============================================================================
 *
 * Purpose:
 * Used when changing a user's shift.
 *
 * Example Use Cases:
 * - Assign Morning Shift
 * - Assign Evening Shift
 * - Assign Night Shift
 * - Transfer Employee Between Shifts
 *
 * Example Request:
 *
 * {
 *   "userId": "661bbc6a9de2e97683d0089c",
 *   "shift": "661bbc6a9de2e97683d0089d"
 * }
 *
 * Flow:
 *
 * Frontend
 *    ↓
 * UserShiftChangeDto Validation
 *    ↓
 * Controller
 *    ↓
 * Service
 *    ↓
 * Update User Shift
 */

export class UserShiftChangeDto {
  /**
   * User ID
   *
   * MongoDB ObjectId of the user
   * whose shift will be changed.
   */

  @IsNotEmpty()
  @IsMongoId()
  @ApiProperty({
    example: '661bbc6a9de2e97683d0089c',
    description: 'The id of the user to be taken action on',
  })
  userId: string;

  /**
   * Shift ID
   *
   * MongoDB ObjectId of the shift
   * that will be assigned to the user.
   *
   * Example:
   * Morning Shift ID
   * Evening Shift ID
   * Night Shift ID
   *
   * Validation:
   * - Cannot be empty
   * - Must be a valid MongoDB ObjectId
   */

  @IsNotEmpty()
  @IsMongoId()
  @ApiProperty({
    example: '661bbc6a9de2e97683d0089c',
    description: 'The id of the shift to be taken action on',
  })
  shift: string;
}
