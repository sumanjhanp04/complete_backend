import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, Max, Min } from "class-validator";

// single data fetch based on month
export class GetMonthQueryDto{
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
  }