import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

// Database Schemas
import {
    ProjectCategory,
    ProjectSubCategory,
} from '@lib/database';

// DTOs
import {
    ProjectCategoryDto,
    ProjectSubCategoryDto,
} from '@lib/dto';

/**
 * ProjectCategoryService
 *
 * Handles:
 * - Category Creation
 * - Category Listing
 * - SubCategory Creation
 * - SubCategory Listing
 *
 * Structure:
 *
 * Project Category
 *      │
 *      ├── Web Development
 *      ├── Mobile Development
 *      ├── Marketing
 *      └── Design
 *
 * Each Category
 *      │
 *      └── Multiple Sub Categories
 */
@Injectable()
export class ProjectCategoryService {
    constructor(
        /**
         * Project Category Collection
         *
         * MongoDB Collection:
         * projectcategories
         */
        @InjectModel(ProjectCategory.name)
        private readonly projectCategoryModel: Model<ProjectCategory>,

        /**
         * Project Sub Category Collection
         *
         * MongoDB Collection:
         * projectsubcategories
         */
        @InjectModel(ProjectSubCategory.name)
        private readonly projectSubCategoryModel: Model<ProjectSubCategory>,
    ) { }

    // ============================================================
    // CREATE CATEGORY
    // ============================================================

    /**
     * Creates a new project category.
     *
     * Example:
     * {
     *   name: "Web Development"
     * }
     *
     * Flow:
     * Request
     *    ↓
     * DTO Validation
     *    ↓
     * MongoDB Create
     *    ↓
     * Return Created Category
     */
    async createCategory(
        category: ProjectCategoryDto,
    ) {
        return await this.projectCategoryModel.create(
            category,
        );
    }

    // ============================================================
    // LIST ALL CATEGORIES
    // ============================================================

    /**
     * Returns all project categories.
     *
     * Example Response:
     *
     * [
     *   {
     *     "_id": "1",
     *     "name": "Web Development"
     *   },
     *   {
     *     "_id": "2",
     *     "name": "Mobile Development"
     *   }
     * ]
     */
    async listCategory() {
        return await this.projectCategoryModel
            .find()
            .exec();
    }

    // ============================================================
    // CREATE SUB CATEGORY
    // ============================================================

    /**
     * Creates a sub category under a category.
     *
     * Example:
     *
     * Category:
     * Web Development
     *
     * Sub Categories:
     * - Frontend
     * - Backend
     * - Full Stack
     *
     * Request:
     * {
     *   name: "Frontend",
     *   category: "categoryId"
     * }
     */
    async creteSubcategory(
        subcategory: ProjectSubCategoryDto,
    ) {
        return await this.projectSubCategoryModel.create(
            subcategory,
        );
    }

    // ============================================================
    // LIST SUB CATEGORIES
    // ============================================================

    /**
     * Returns all subcategories
     * belonging to a specific category.
     *
     * Example:
     *
     * Category:
     * Web Development
     *
     * Result:
     * [
     *   Frontend,
     *   Backend,
     *   Full Stack
     * ]
     */
    async listSubCategory(
        category: string,
    ) {
        return await this.projectSubCategoryModel.find({
            category: category,
        });
    }

    // ============================================================
    // LIST ALL SUB CATEGORIES
    // ============================================================

    /**
     * Future Feature
     *
     * Returns every subcategory
     * from database.
     *
     * Example:
     *
     * [
     *   Frontend,
     *   Backend,
     *   Full Stack,
     *   Android,
     *   iOS
     * ]
     */

    // async listAllSubCategories() {
    //   return this.projectSubCategoryModel
    //     .find()
    //     .exec();
    // }
}