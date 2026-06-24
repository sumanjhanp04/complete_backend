// NestJS Mongoose decorators
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

// Mongoose imports
import mongoose, { Document, SchemaTypes, mongo } from 'mongoose';

// Related schemas
import { User } from '../authentication/user.schema';
import { Projects } from './projects.schema';

/*
|--------------------------------------------------------------------------
| PROJECT HISTORY SCHEMA
|--------------------------------------------------------------------------
| Purpose:
| Store all activities performed inside a project.
|
| Example:
| "Suman created a task"
| "Rahul updated project status"
| "Admin added a new member"
|--------------------------------------------------------------------------
*/

@Schema({
  timestamps: true, // Adds createdAt and updatedAt automatically
  versionKey: false, // Removes __v field
})
export class ProjectsHistory extends Document {
  /*
   * User who performed the action
   *
   * Example:
   * createdBy = User ObjectId
   */
  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: User.name, // Reference to User collection
  })
  createdBy: User;

  /*
   * Activity message
   *
   * Examples:
   * "Created Task Login API"
   * "Added member Rahul"
   * "Updated project status"
   */
  @Prop()
  message: string;

  /*
   * Time when activity happened
   *
   * Example:
   * 2026-06-24T10:30:00Z
   */
  @Prop()
  time: Date;

  /*
   * Project associated with this history record
   *
   * Reference to Projects collection
   */
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: Projects.name,
  })
  projectID: Projects;
}

/*
|--------------------------------------------------------------------------
| Convert Class into MongoDB Schema
|--------------------------------------------------------------------------
*/
export const projectsHistorySchema =
  SchemaFactory.createForClass(ProjectsHistory);
