// user.dto.ts
import { USER_TYPE_MAP, USER_TYPES } from '@lib/database';
import {
  IsNotEmpty,
  IsEnum,
  IsBoolean,
  IsString,
  IsNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserDto {
  @ApiProperty({
    description: 'The unique identifier of the user',
    example: '1234567890',
  })
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    enum: USER_TYPES,
    description: 'The reference ID of the user type',
    example: USER_TYPE_MAP.CLIENT,
  })
  @IsNotEmpty()
  @IsEnum(USER_TYPES)
  userIdRef: string;

  @ApiProperty({
    enum: USER_TYPES,
    description: 'The type of the user',
    example: USER_TYPE_MAP.CLIENT,
  })
  @IsNotEmpty()
  @IsEnum(USER_TYPES)
  userType: string;

  @ApiProperty({
    description: 'The password of the user',
    example: 'StrongPassword!23',
  })
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiPropertyOptional({
    description: 'Indicates if the user wants to reset their password',
    example: false,
  })
  @IsBoolean()
  wantReset?: boolean;

  @ApiPropertyOptional({
    description: 'The secret key for the user',
    example: 'user-secret-key',
  })
  secret?: string;

  @ApiPropertyOptional({
    description: 'The status of the user',
    example: true,
  })
  @IsBoolean()
  status?: boolean;
  @ApiPropertyOptional({
    description: 'The status of the allocated space',
    example: '500mb',
  })
  @IsNumber()
  allocatedSpace?: number;
}

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'The unique identifier of the user',
    example: '1234567890',
  })
  userId?: string;

  @ApiPropertyOptional({
    enum: USER_TYPES,
    description: 'The reference ID of the user type',
    example: USER_TYPE_MAP.CLIENT,
  })
  @IsEnum(USER_TYPES)
  userIdRef?: string;

  @ApiPropertyOptional({
    enum: USER_TYPES,
    description: 'The type of the user',
    example: USER_TYPE_MAP.CLIENT,
  })
  @IsEnum(USER_TYPES)
  userType?: string;

  @ApiPropertyOptional({
    description: 'Indicates if the user is a manager',
    example: true,
  })
  @IsBoolean()
  isManager?: boolean;

  @ApiPropertyOptional({
    type: [String],
    description: 'The list of users assigned to this user',
    example: ['user1', 'user2'],
  })
  assignedUsers?: string[];

  @ApiPropertyOptional({
    description: 'Indicates if the user is working from home',
    example: true,
  })
  @IsBoolean()
  workfromhome?: boolean;

  @ApiPropertyOptional({
    description: 'Indicates if the user wants to reset their password',
    example: true,
  })
  @IsBoolean()
  wantReset?: boolean;

  @ApiPropertyOptional({
    description: 'The secret key for the user',
    example: 'user-secret-key',
  })
  secret?: string;

  @ApiPropertyOptional({
    description: 'The secret key for the user',
    example: 'user-secret-key',
  })
  shift?: string;

  @ApiPropertyOptional({
    description: 'The status of the user',
    example: true,
  })
  @IsBoolean()
  status?: boolean;
  @ApiPropertyOptional({
    description: 'The status of the allocated space',
    example: '500mb',
  })
  @IsNumber()
  allocatedSpace?: number;
}
