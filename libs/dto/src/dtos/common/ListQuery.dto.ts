import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class ListQueryDTO {
  @ApiPropertyOptional({
    description: 'Keyword for searching employees',
    example: 'John',
  })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Limit of items per page',
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({
    description: 'Sort order (asc or desc)',
    example: 'asc',
    enum: ['asc', 'desc'],
  })
  @IsOptional()
  @IsString()
  sort?: 'asc' | 'desc';

  @ApiPropertyOptional({
    description: 'Field by which to sort',
    example: '_id',
  })
  @IsOptional()
  @IsString()
  sortBy?: string;
}
