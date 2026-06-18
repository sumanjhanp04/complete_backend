import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ProjectCategoryService } from '../services/category.service';
import { ProjectCategoryDto, ProjectSubCategoryDto } from '@lib/dto';
import { UserDetails } from '@lib/decorators';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { demoDelay } from '@lib/common';

@ApiTags("Project Categories")
@Controller('project-category')
@ApiBearerAuth()
export class ProjectCategoryController {
    constructor(
        private readonly projectCategoryService: ProjectCategoryService
    ) { }

    @Get()
    async getAllCategory() {
        return await this.projectCategoryService.listCategory();
    }

    @Get(':subcategory')
    async getAllSubCategory(@Param('subcategory') subcategory: string) {
        return await this.projectCategoryService.listSubCategory(subcategory);
    }

    @Post()
    async createCategory(@Body() category: ProjectCategoryDto, @UserDetails() user: any) {
        return await this.projectCategoryService.createCategory({ ...category, createdBy: user?._id });
    }

    @Post('subcategory')
    async createSubCategory(@Body() subcategory: ProjectSubCategoryDto, @UserDetails() user: any) {
        return await this.projectCategoryService.creteSubcategory({ ...subcategory, createdBy: user?._id });
    }
}