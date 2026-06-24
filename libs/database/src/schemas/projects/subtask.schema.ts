// NestJS Mongoose decorators
import { Schema, SchemaFactory, Prop } from '@nestjs/mongoose';

// Mongoose imports
import mongoose, { Document } from 'mongoose';

// Related schemas
import { User } from '../authentication/user.schema';
import { Tasks } from './tasks.schema';

// Type used throughout service files
export type SubTasksDocument = SubTasks & Document;

/*
|--------------------------------------------------------------------------
| SUB TASK SCHEMA
|--------------------------------------------------------------------------
| Stores small tasks that belong to a parent task.
|--------------------------------------------------------------------------
*/

@Schema({
  timestamps: true, // Adds createdAt and updatedAt automatically
  versionKey: false, // Removes __v field
})
export class SubTasks {
  /*
   * Subtask title
   *
   * Example:
   * "Create Login API"
   */
  @Prop({ required: true })
  title: string;

  /*
   * Parent Task Reference
   *
   * Every subtask belongs to one task.
   */
  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: Tasks.name,
  })
  task: string;

  /*
   * Completion Status
   *
   * false = Pending
   * true = Completed
   */
  @Prop({ default: false })
  isCompleted: boolean;

  /*
   * User assigned to this subtask
   *
   * Can be null if nobody is assigned.
   */
  @Prop({
    required: false,
    default: null,
    type: mongoose.Schema.Types.ObjectId,
    ref: User.name,
  })
  assignedTo?: string | null;

  /*
   * User who last updated this subtask
   */
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: User.name,
  })
  updatedBy?: string;

  /*
   * User who created this subtask
   */
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: User.name,
  })
  createdBy: string;
}

// Create MongoDB schema from class
export const SubTasksSchema = SchemaFactory.createForClass(SubTasks);
