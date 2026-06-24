// Import decorators for schema creation
import { Schema, SchemaFactory, Prop } from '@nestjs/mongoose';

// Import mongoose and document types
import mongoose, { Document, ObjectId } from 'mongoose';

// Import User schema
import { User } from '../authentication/user.schema';

// =====================================================
// PROJECT CATEGORY
// =====================================================

// Type for mongoose document
export type ProjectCategoryDocument = ProjectCategory & Document;

// Create schema
@Schema({
  timestamps: true, // Adds createdAt & updatedAt
  versionKey: false, // Removes __v field
})
export class ProjectCategory {
  // Category name
  // Example:
  // Software Development
  // Marketing
  // HR
  @Prop()
  name: string;

  // Optional description
  @Prop()
  description?: string;

  // User who created category
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: User.name,
    required: true,
  })
  createdBy: string;
}

// Convert class into schema
export const ProjectCategorySchema =
  SchemaFactory.createForClass(ProjectCategory);

// =====================================================
// PROJECT SUB CATEGORY
// =====================================================

// Type for mongoose document
export type ProjectSubCategoryDocument = ProjectSubCategory & Document;

// Create schema
@Schema({
  timestamps: true,
  versionKey: false,
})
export class ProjectSubCategory {
  // Sub-category name
  // Example:
  // Backend
  // Frontend
  // DevOps
  @Prop()
  name: string;

  // Parent Category ID
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: ProjectCategory.name,
    required: true,
  })
  category: string;

  // User who created sub-category
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: User.name,
    required: true,
  })
  createdBy: string;
}

// Convert class into schema
export const ProjectSubCategorySchema =
  SchemaFactory.createForClass(ProjectSubCategory);
