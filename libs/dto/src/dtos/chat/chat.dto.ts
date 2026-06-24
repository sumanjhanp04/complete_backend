// Swagger decorators for API documentation
import { ApiProperty } from '@nestjs/swagger';

// Validation decorators from class-validator
import {
  IsArray,
  IsNumber,
  IsString,
  registerDecorator,
  ValidateNested,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

// File metadata DTO (not used in this file directly)
import { FileMetadata } from '../credentials/create-file-credentials.dto';

// Used to transform plain JSON into DTO objects
import { Type } from 'class-transformer';

// Constants from common library
import {
  MAX_OTHER_FILE_SIZE_ALLOWED,
  MAX_VIDEO_FILE_SIZE_ALLOWED,
  VIDEO_FILE_TYPE,
} from '@lib/common';

/**
 * DTO used for chat message id validation
 */
export class ChatDto {
  @ApiProperty({
    description: 'The id of the message',
    example: '6809e23f76c3c9554d4dd382',
  })
  @IsString() // Must be a string
  id: string;
}

/**
 * DTO used for room id validation
 */
export class roomIdDto {
  @ApiProperty({
    description: 'The id of the room',
    example: '6809e23f76c3c9554d4dd382',
  })
  @IsString() // Must be a string
  id: string;
}

/**
 * Custom Validator Class
 *
 * Checks file size based on file type.
 *
 * Video files:
 *      size <= MAX_VIDEO_FILE_SIZE_ALLOWED
 *
 * Other files:
 *      size <= MAX_OTHER_FILE_SIZE_ALLOWED
 */
@ValidatorConstraint({
  name: 'IsValidFileSize',
  async: false,
})
export class FileSizeConstraint implements ValidatorConstraintInterface {
  validate(size: number, args: ValidationArguments) {
    // Current object being validated
    const object = args.object as any;

    // file mime type
    const type = object.type;

    /**
     * Example:
     * image/jpeg
     * application/pdf
     * video/mp4
     */

    // If file is video
    if (VIDEO_FILE_TYPE.includes(type)) {
      return size <= MAX_VIDEO_FILE_SIZE_ALLOWED;
    }

    // For all other file types
    return size <= MAX_OTHER_FILE_SIZE_ALLOWED;
  }

  /**
   * Error message if validation fails
   */
  defaultMessage(args: ValidationArguments) {
    return `File size is too large`;
  }
}

/**
 * Custom Decorator
 *
 * Usage:
 * @IsValidFileSize()
 * size:number;
 */
export function IsValidFileSize(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: FileSizeConstraint,
    });
  };
}

/**
 * Represents a single file
 */
export class ChatFileMetadata {
  /**
   * File Name
   *
   * Example:
   * photo.jpg
   */
  @ApiProperty({
    description: 'The file name',
    type: String,
    required: true,
    example: 'file.jpeg',
  })
  @IsString()
  filename: string;

  /**
   * File Size
   *
   * Custom validation applied
   */
  @ApiProperty({
    description: 'The file size in bytes',
    type: Number,
    required: true,
    example: 1024,
  })
  @IsNumber()
  @IsValidFileSize()
  size: number;

  /**
   * MIME Type
   *
   * Example:
   * image/jpeg
   * video/mp4
   * application/pdf
   */
  @ApiProperty({
    description: 'The file content type',
    type: String,
    required: true,
    example: 'image/jpeg',
  })
  @IsString()
  type: string;
}

/**
 * Main DTO used when creating upload credentials
 *
 * Expected Request:
 *
 * {
 *   "files":[
 *      {
 *          "filename":"photo.jpg",
 *          "size":50000,
 *          "type":"image/jpeg"
 *      }
 *   ],
 *   "id":"6809e23f76c3c9554d4dd382"
 * }
 */
export class CreateChatFileCredentialDto {
  /**
   * List of files
   */
  @ApiProperty({
    type: () => [ChatFileMetadata],
    description: 'The files to upload',
    required: true,
  })
  @IsArray() // Must be an array
  @ValidateNested({ each: true })
  // Validate every object inside array
  @Type(() => ChatFileMetadata)
  // Convert plain JSON -> ChatFileMetadata object
  files: ChatFileMetadata[];

  /**
   * Room ID
   */
  @ApiProperty({
    description: 'The id of the room',
    example: '6809e23f76c3c9554d4dd382',
  })
  @IsString()
  id: string;
}
