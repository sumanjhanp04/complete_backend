import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class GetTimeQueryDto {
  @ApiPropertyOptional({
    description: 'Keyword for getting the TimeSheet based on Month',
    example: '01',
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(11)
  month: number;

  @ApiPropertyOptional({
    description: 'Keyword for searching the TimeSheet based on Year',
    example: 2024,
  })
  @Type(() => Number)
  @IsInt()
  @Min(2020)
  year: number;

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
    example: 'desc',
    enum: ['asc', 'desc'],
  })
  @IsOptional()
  @IsString()
  sort?: 'desc' | 'asc';

  @ApiPropertyOptional({
    description: 'Field by which to sort',
    example: '_id',
  })
  @IsOptional()
  @IsString()
  sortBy?: string;
}

