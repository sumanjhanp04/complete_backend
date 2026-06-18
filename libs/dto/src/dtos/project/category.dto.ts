import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class ProjectCategoryDto {
    @ApiProperty({
        description: 'Category name',
        example: 'Category name',
        required: true
    })
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional({
        description: 'Category Description',
        example: 'Category Descripition',
        required: false
    })
    @IsOptional()
    @IsString()
    description?: string;


    createdBy?: string;

}


export class ProjectSubCategoryDto {
    @ApiProperty({
        description: 'Sub Category name',
        example: 'Sub Category name',
        required: true
    })
    @IsNotEmpty()
    name: string;

    @ApiProperty({
        description: 'Sub Category name',
        example: 'category_id_here',
        required: true
    })
    @IsNotEmpty()
    category: string;


    createdBy?: string;
}