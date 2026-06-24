// Swagger documentation
import { ApiPropertyOptional } from '@nestjs/swagger';

// Validation decorators
import { IsOptional, IsString, IsInt, Min } from 'class-validator';

// Used to convert query string values
import { Type } from 'class-transformer';

/**
 * Generic List Query DTO
 *
 * Used for:
 *
 * GET /clients
 * GET /employees
 * GET /companies
 *
 * Example:
 *
 * /clients?page=1&limit=10&keyword=john
 */
export class ListQueryDTO {
  /**
   * Search Keyword
   *
   * Example:
   * ?keyword=john
   */
  @ApiPropertyOptional({
    description: 'Keyword for searching employees',
    example: 'John',
  })
  @IsOptional()
  @IsString()
  keyword?: string;

  /**
   * Page Number
   *
   * Example:
   * ?page=1
   */
  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
  })
  @IsOptional()

  // Convert query string -> number
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  /**
   * Items Per Page
   *
   * Example:
   * ?limit=10
   */
  @ApiPropertyOptional({
    description: 'Limit of items per page',
    example: 10,
  })
  @IsOptional()

  // Convert query string -> number
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  /**
   * Sort Order
   *
   * Example:
   * ?sort=asc
   * ?sort=desc
   */
  @ApiPropertyOptional({
    description: 'Sort order (asc or desc)',
    example: 'asc',
    enum: ['asc', 'desc'],
  })
  @IsOptional()
  @IsString()
  sort?: 'asc' | 'desc';

  /**
   * Sort By Field
   *
   * Example:
   * ?sortBy=createdAt
   */
  @ApiPropertyOptional({
    description: 'Field by which to sort',
    example: '_id',
  })
  @IsOptional()
  @IsString()
  sortBy?: string;
}
