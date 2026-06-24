// NestJS Mongoose decorators
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

// Mongoose imports
import mongoose, { Document } from 'mongoose';

// User schema reference
import { User } from '../authentication/user.schema';

// Priority constants
import { TASK_PRIORITY } from '../consts/consts.schema';

/*
|--------------------------------------------------------------------------
| TASK SCHEMA
|--------------------------------------------------------------------------
| Stores project tasks.
|
| Example:
| Task: Build Login Module
|--------------------------------------------------------------------------
*/

@Schema({
  timestamps: true, // Adds createdAt and updatedAt automatically
  versionKey: false, // Removes __v field
})
export class Tasks extends Document {
  /*
   * Task Name
   *
   * Example:
   * "Build Login API"
   */
  @Prop({ required: true })
  name: string;

  /*
   * Task Description
   *
   * Example:
   * "Create JWT authentication APIs"
   */
  @Prop()
  description?: string;

  /*
   * Users assigned to this task
   *
   * One task can have multiple users.
   */
  @Prop({
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: User.name,
      },
    ],
    ref: User.name,
    default: [],
  })
  assignedUser: User[] | [];

  /*
   * Estimated duration
   *
   * Example:
   * 5 hours
   * 3 days
   */
  @Prop({ default: null })
  duration?: number | null;

  /*
   * Task completion status
   *
   * false = Pending
   * true = Completed
   */
  @Prop({
    default: false,
  })
  isCompleted: boolean;

  /*
   * Task Priority
   *
   * Values come from TASK_PRIORITY constant.
   *
   * Example:
   * low
   * normal
   * high
   * urgent
   */
  @Prop({
    enum: TASK_PRIORITY,
    default: 'normal',
  })
  priority: string;

  /*
   * Tags (currently commented out)
   *
   * Example:
   * backend
   * frontend
   * bug
   */
  // @Prop({ type:String, default: null })
  // tags: string;

  /*
   * Task Start Date
   */
  @Prop()
  startDate?: string;

  /*
   * Task End Date / Deadline
   */
  @Prop()
  endDate?: string;

  /*
   * Last user who modified task
   */
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: User.name,
  })
  updatedBy?: User | null;

  /*
   * User who created task
   */
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: User.name,
  })
  createdBy?: User | null;
}

// Convert class into MongoDB schema
export const tasksSchema = SchemaFactory.createForClass(Tasks);
