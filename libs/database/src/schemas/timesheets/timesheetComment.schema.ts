// NestJS Mongoose decorators
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

// Mongoose imports
import mongoose, { Document, now } from 'mongoose';

// Employee schema
import { Employee } from '../employees/employee.schema';

// Type used in services
export type TimeSheetCommentType = TimeSheetComment & Document;

/*
|--------------------------------------------------------------------------
| TIMESHEET COMMENT SCHEMA
|--------------------------------------------------------------------------
| Stores comments related to a timesheet.
|--------------------------------------------------------------------------
*/

@Schema({
  timestamps: true, // Adds createdAt and updatedAt
})
export class TimeSheetComment {
  /*
   * Reference to Timesheet
   *
   * Which timesheet does this comment belong to?
   */
  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,

    // ❌ Looks suspicious
    // Currently references TimeSheetComment itself
    ref: TimeSheetComment.name,
  })
  timeSheet: string;

  /*
   * Array of comments
   *
   * Each object contains:
   * - User who commented
   * - Date of comment
   * - Actual comment text
   */
  @Prop({
    required: true,
    type: [
      {
        /*
         * Employee who wrote comment
         */
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: Employee.name,
        },

        /*
         * Comment date
         */
        date: {
          type: Date,
          default: new Date(),
        },

        /*
         * Comment text
         */
        comment: String,
      },
    ],
  })
  commentContent: Array<{
    userId: mongoose.Types.ObjectId;
    date: Date;
    comment: string;
  }>;
}

// Convert class into MongoDB schema
export const TimeSheetCommentSchema =
  SchemaFactory.createForClass(TimeSheetComment);
