
import { IsArray, IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
// import { SharedWithDto } from './create-file-credentials.dto';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
 class SharedWithDto {
  @ApiProperty({
    description: 'The ID of the user to share the file with',
    type: String,
    example: '675a80724914646669719555',
  })
  @IsString()
  userId: string;

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

export class UpdateFileCredentialDto {
  
   @IsArray()
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => SharedWithDto)
    sharedWith?: SharedWithDto[];
}
