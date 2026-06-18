import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ProjectCategory, ProjectSubCategory } from '@lib/database';
import { ProjectCategoryDto, ProjectSubCategoryDto } from '@lib/dto';

@Injectable()
export class ProjectCategoryService {
    constructor(
        @InjectModel(ProjectCategory.name) private readonly projectCategoryModel: Model<ProjectCategory>,
        @InjectModel(ProjectSubCategory.name) private readonly projectSubCategoryModel: Model<ProjectSubCategory>,
    ) { }



    async createCategory(category: ProjectCategoryDto) {
        return await this.projectCategoryModel.create(category);
    }

    async listCategory() {
        return await this.projectCategoryModel.find().exec();
    }


    async creteSubcategory(subcategory: ProjectSubCategoryDto) {
        return await this.projectSubCategoryModel.create(subcategory);
    }

    async listSubCategory(category: string) {
        return await this.projectSubCategoryModel.find({ category: category })
    }

    // async listAllSubCategories() {
    //     return this.projectSubCategoryModel.find().exec();
    // }
}
