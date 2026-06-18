import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty } from 'class-validator';

export class UserStatusChangeDTO {
  @IsNotEmpty()
  @IsMongoId()
  @ApiProperty({
    example: '661bbc6a9de2e97683d0089c',
    description: 'The id of the user to be taken action on',
  })
  userId: string;
}

export class UserShiftChangeDto {
  @IsNotEmpty()
  @IsMongoId()
  @ApiProperty({
    example: '661bbc6a9de2e97683d0089c',
    description: 'The id of the user to be taken action on',
  })
  userId: string;

  @IsNotEmpty()
  @IsMongoId()
  @ApiProperty({
    example: '661bbc6a9de2e97683d0089c',
    description: 'The id of the shift to be taken action on',
  })
  shift: string;
}
