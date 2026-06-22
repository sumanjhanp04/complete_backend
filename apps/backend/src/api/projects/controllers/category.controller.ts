import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ProjectCategoryService } from '../services/category.service';
import { ProjectCategoryDto, ProjectSubCategoryDto } from '@lib/dto';
import { UserDetails } from '@lib/decorators';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { demoDelay } from '@lib/common';

/*
|--------------------------------------------------------------------------
| Project Category Controller
|--------------------------------------------------------------------------
|
| This controller manages:
| - Project Categories
| - Project Subcategories
|
| Responsibilities:
| - Create Category
| - Create Subcategory
| - List Categories
| - List Subcategories
|
| Controller -> Service -> Database
|
|--------------------------------------------------------------------------
*/

@ApiTags('Project Categories') // Swagger API Group Name
@Controller('project-category') // Base Route => /project-category
@ApiBearerAuth() // Enables JWT Authorization in Swagger
export class ProjectCategoryController {
    /*
    |--------------------------------------------------------------------------
    | Dependency Injection
    |--------------------------------------------------------------------------
    |
    | Inject ProjectCategoryService for business logic.
    |
    |--------------------------------------------------------------------------
    */
    constructor(
        private readonly projectCategoryService: ProjectCategoryService,
    ) { }

    /*
    |--------------------------------------------------------------------------
    | Get All Categories
    |--------------------------------------------------------------------------
    |
    | Endpoint:
    | GET /project-category
    |
    | Purpose:
    | Fetch all project categories.
    |
    |--------------------------------------------------------------------------
    */
    @Get()
    async getAllCategory() {
        // Retrieve all categories from database
        return await this.projectCategoryService.listCategory();
    }

    /*
    |--------------------------------------------------------------------------
    | Get All Subcategories
    |--------------------------------------------------------------------------
    |
    | Endpoint:
    | GET /project-category/:subcategory
    |
    | Example:
    | GET /project-category/WebDevelopment
    |
    | Purpose:
    | Fetch all subcategories for a category.
    |
    |--------------------------------------------------------------------------
    */
    @Get(':subcategory')
    async getAllSubCategory(
        @Param('subcategory') subcategory: string,
    ) {
        // Retrieve subcategories based on category name/id
        return await this.projectCategoryService.listSubCategory(
            subcategory,
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Create Category
    |--------------------------------------------------------------------------
    |
    | Endpoint:
    | POST /project-category
    |
    | Purpose:
    | Create a new project category.
    |
    |--------------------------------------------------------------------------
    */
    @Post()
    async createCategory(
        @Body() category: ProjectCategoryDto,
        @UserDetails() user: any,
    ) {
        // Add creator ID before saving category
        return await this.projectCategoryService.createCategory({
            ...category,
            createdBy: user?._id,
        });
    }

    /*
    |--------------------------------------------------------------------------
    | Create Subcategory
    |--------------------------------------------------------------------------
    |
    | Endpoint:
    | POST /project-category/subcategory
    |
    | Purpose:
    | Create a new project subcategory.
    |
    |--------------------------------------------------------------------------
    */
    @Post('subcategory')
    async createSubCategory(
        @Body() subcategory: ProjectSubCategoryDto,
        @UserDetails() user: any,
    ) {
        // Add creator ID before saving subcategory
        return await this.projectCategoryService.creteSubcategory({
            ...subcategory,
            createdBy: user?._id,
        });
    }
}