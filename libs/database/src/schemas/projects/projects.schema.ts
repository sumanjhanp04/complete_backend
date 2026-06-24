// NestJS Mongoose decorators
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

// Mongoose imports
import mongoose, { Document } from 'mongoose';

// Related schemas
import { User } from '../authentication/user.schema';
import { Company } from '../clients/company.schema';
import { ProjectCategory, ProjectSubCategory } from './projectCategory.schema';

/*
|--------------------------------------------------------------------------
| PROJECT SCHEMA
|--------------------------------------------------------------------------
| Stores complete project information.
|
| Example:
| Project Name: Employee Management System
| Category: Web Development
| Company: ABC Pvt Ltd
| Admin: Suman
|--------------------------------------------------------------------------
*/

@Schema({
  timestamps: true, // Adds createdAt and updatedAt
  versionKey: false, // Removes __v field
})
export class Projects extends Document {
  /*
   * Project Name
   *
   * Example:
   * "Employee Management System"
   */
  @Prop({ required: true })
  name: string;

  /*
   * Project Description
   *
   * Example:
   * "A system to manage employee attendance."
   */
  @Prop()
  description?: string;

  /*
   * Project Owner/Admin
   *
   * Reference to User Collection
   */
  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: User.name,
  })
  admin: User;

  /*
   * Project Category
   *
   * Example:
   * Web Development
   * Mobile App
   * AI/ML
   */
  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: ProjectCategory.name,
  })
  category: string;

  /*
   * Project Sub Category
   *
   * Example:
   * ReactJS
   * NestJS
   * Android
   */
  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: ProjectSubCategory.name,
  })
  subCategory: string;

  /*
   * Project Start Date
   */
  @Prop()
  startDate: string;

  /*
   * Project End Date
   */
  @Prop()
  endDate: string;

  /*
   * Project Status
   *
   * true = Active
   * false = Inactive
   */
  @Prop({
    required: true,
    default: true,
  })
  status: boolean;

  /*
   * Client Company
   *
   * Example:
   * TCS
   * Infosys
   * PAS Digital
   */
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: Company.name,
  })
  company: Company | null;

  /*
   * Team Members assigned to project
   *
   * Array of User IDs
   */
  @Prop({
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: User.name,
      },
    ],
    ref: User.name,
  })
  assignedUser: User[] | [];
}

/*
|--------------------------------------------------------------------------
| Convert Class into MongoDB Schema
|--------------------------------------------------------------------------
*/
export const projectsSchema = SchemaFactory.createForClass(Projects);
