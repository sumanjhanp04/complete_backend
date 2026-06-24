// NestJS Mongoose decorators
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

// Mongoose imports
import mongoose, { Document } from 'mongoose';

// Related schemas
import { User } from '../authentication/user.schema';
import { Tasks } from './tasks.schema';
import { Columns } from './columns.schema';

/*
|--------------------------------------------------------------------------
| TASK HISTORY SCHEMA
|--------------------------------------------------------------------------
| Stores activity logs related to tasks.
|
| Examples:
| - Task Created
| - User Assigned
| - Priority Changed
| - Task Completed
| - Task Moved To Another Column
|--------------------------------------------------------------------------
*/

@Schema({
  timestamps: true, // Adds createdAt and updatedAt
  versionKey: false, // Removes __v field
})
export class TasksHistory extends Document {
  /*
   * User who performed the action
   *
   * Example:
   * Suman
   * Rahul
   */
  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: User.name,
  })
  createdBy: User;

  /*
   * Description of activity
   *
   * Examples:
   * "Created Task Login API"
   * "Assigned Rahul"
   * "Changed Priority High -> Urgent"
   * "Completed Task"
   */
  @Prop()
  message: string;

  /*
   * Old column before move
   *
   * Example:
   * TODO
   *
   * Currently commented out
   */

  // @Prop({
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: Columns.name
  // })
  // colFrom: Columns;

  /*
   * New column after move
   *
   * Example:
   * IN PROGRESS
   *
   * Currently commented out
   */

  // @Prop({
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: Columns.name
  // })
  // colTo: Columns;

  /*
   * Task related to this history entry
   */
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: Tasks.name,
  })
  taskId: Tasks;
}

// Create MongoDB schema
export const tasksHistorySchema = SchemaFactory.createForClass(TasksHistory);
