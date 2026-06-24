// Validation decorators
import {
  IsString,
  IsArray,
  ValidateNested,
  IsEnum,
  IsOptional,
  IsNumber,
} from 'class-validator';

// Used for nested DTO conversion
import { Type } from 'class-transformer';

// Swagger Documentation
import { ApiProperty } from '@nestjs/swagger';

/**
 * Shared User DTO
 *
 * Represents a user who can access
 * uploaded files.
 */
export class SharedWithDto {
  /**
   * User ID
   */
  @ApiProperty({
    description: 'The ID of the user to share the file with',
    type: String,
    example: '675a80724914646669719555',
  })
  @IsString()
  userId: string;

  /**
   * Access Permission
   *
   * Allowed:
   * read
   * write
   */
  @ApiProperty({
    description: 'Access level for the shared user',
    type: String,
    enum: ['read', 'write'],
    example: 'write',
  })
  @IsString()
  @IsEnum(['read', 'write'], {
    message: 'Access level must be either read or write',
  })
  accessLevel: string;
}

/**
 * File Metadata DTO
 *
 * Represents a single uploaded file.
 */
export class FileMetadata {
  /**
   * File Name
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
   * Stored in bytes
   */
  @ApiProperty({
    description: 'The file size in bytes',
    type: Number,
    required: true,
    example: 1024,
  })
  @IsNumber()
  size: number;

  /**
   * MIME Type
   *
   * Example:
   * image/jpeg
   * application/pdf
   * video/mp4
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
 * Main DTO
 *
 * Used when requesting upload credentials.
 */
export class CreateFileCredentialDto {
  /**
   * Files To Upload
   */
  @ApiProperty({
    type: () => [FileMetadata],
    description: 'The files to upload',
    required: true,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FileMetadata)
  files: FileMetadata[];

  /**
   * Shared Users
   *
   * Optional
   */
  @ApiProperty({
    description:
      'List of users with whom the file is shared, including access levels',

    type: [SharedWithDto],

    required: false,

    example: [
      {
        userId: '675a80724914646669719555',
        accessLevel: 'read',
      },
      {
        userId: '66bb169a852d4178c268c623',
        accessLevel: 'write',
      },
    ],
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SharedWithDto)
  sharedWith?: SharedWithDto[];
}
