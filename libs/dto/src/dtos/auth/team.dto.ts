// Import Swagger decorators
// ApiProperty -> Used to generate Swagger API documentation.
// PartialType -> Automatically creates an update DTO where all fields become optional.
import { ApiProperty, PartialType } from '@nestjs/swagger';

// Import validation decorators from class-validator.
// These decorators validate incoming request data before it reaches the controller.
import {
  ArrayNotEmpty,
  IsArray,
  IsMongoId,
  IsNotEmpty,
  IsString,
} from 'class-validator';

/**
 * ============================================================================
 * CreateTeamDto
 * ============================================================================
 *
 * Purpose:
 * Used when creating a new team.
 *
 * Example Request:
 *
 * {
 *   "name": "Development Team",
 *   "teamLead": "60c72b2f9b1d4c3c7f5a5f9b",
 *   "members": [
 *      "60c72b2f9b1d4c3c7f5a5f9b",
 *      "60c72b2f9b1d4c3c7f5a5f9d"
 *   ]
 * }
 *
 * Flow:
 *
 * Frontend
 *     ↓
 * CreateTeamDto Validation
 *     ↓
 * Team Controller
 *     ↓
 * Team Service
 *     ↓
 * MongoDB Team Collection
 */

export class CreateTeamDto {
  /**
   * Team Name
   *
   * Example:
   * "Development Team"
   *
   * Validation:
   * - Must be a string.
   * - Cannot be empty.
   */
  @ApiProperty({
    description: 'Team name',
    example: 'Development Team',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  /**
   * Team Lead ID
   *
   * Stores the MongoDB ObjectId of the team leader.
   *
   * Example:
   * "60c72b2f9b1d4c3c7f5a5f9b"
   *
   * Validation:
   * - Must be a string.
   * - Must be a valid MongoDB ObjectId.
   * - Cannot be empty.
   */
  @ApiProperty({
    description: 'Team Lead',
    example: '60c72b2f9b1d4c3c7f5a5f9b',
    required: true,
  })
  @IsString()
  @IsMongoId()
  @IsNotEmpty()
  teamLead: string;

  /**
   * Team Members
   *
   * Array containing MongoDB ObjectIds
   * of all members assigned to the team.
   *
   * Example:
   *
   * [
   *   "60c72b2f9b1d4c3c7f5a5f9b",
   *   "60c72b2f9b1d4c3c7f5a5f9d"
   * ]
   *
   * Validation:
   * - Must be an array.
   * - Array cannot be empty.
   * - Every element must be a valid MongoDB ObjectId.
   */
  @ApiProperty({
    description: 'Array of team member IDs',
    example: ['60c72b2f9b1d4c3c7f5a5f9b', '60c72b2f9b1d4c3c7f5a5f9d'],
    required: true,
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsMongoId({ each: true })
  members: string[];

  /**
   * User who created the team.
   *
   * Usually not sent from frontend.
   * Added by backend from JWT token.
   *
   * Example:
   *
   * req.user._id
   */
  createdBy?: string;

  /**
   * User who last updated the team.
   *
   * Usually maintained automatically by backend.
   */
  updatedBy?: string;
}

/**
 * ============================================================================
 * UpdateTeamDto
 * ============================================================================
 *
 * Purpose:
 * Used when updating an existing team.
 *
 * PartialType(CreateTeamDto)
 * automatically converts all fields from
 * CreateTeamDto into optional fields.
 *
 * Generated Equivalent:
 *
 * class UpdateTeamDto {
 *    name?: string;
 *    teamLead?: string;
 *    members?: string[];
 *    createdBy?: string;
 *    updatedBy?: string;
 * }
 *
 * Example Update Request:
 *
 * {
 *    "name": "Backend Team"
 * }
 *
 * OR
 *
 * {
 *    "members": [
 *      "60c72b2f9b1d4c3c7f5a5f9b"
 *    ]
 * }
 *
 * Only the fields being modified need
 * to be sent.
 */

export class UpdateTeamDto extends PartialType(CreateTeamDto) {}
