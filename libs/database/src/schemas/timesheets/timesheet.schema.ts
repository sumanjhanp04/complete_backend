// NestJS Mongoose decorators
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

// Mongoose imports
import mongoose, { Document } from 'mongoose';

// Employee schema
import { Employee } from '../employees/employee.schema';

// Status enum
import { STATUS } from '../consts/consts.schema';

// Type used in services
export type TimeSheetDocument = TimeSheet & Document;

/*
|--------------------------------------------------------------------------
| TIMESHEET SCHEMA
|--------------------------------------------------------------------------
| Stores employee work logs.
|
| Example:
| Employee worked 6 hours on Login API.
|--------------------------------------------------------------------------
*/

@Schema({
  timestamps: true, // Adds createdAt and updatedAt
})
export class TimeSheet {
  /*
   * Work description
   *
   * Example:
   * "Developed Login API"
   * "Fixed Payment Bug"
   */
  @Prop({ required: true })
  content: string;

  /*
   * Employee who submitted timesheet
   */
  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: Employee.name,
  })
  userId: string;

  /*
   * Time spent
   *
   * Example:
   * "4 Hours"
   * "8 Hours"
   */
  @Prop({ required: true })
  duration: string;

  /*
   * Date for which work is submitted
   *
   * Example:
   * 2026-06-24
   */
  @Prop({ require: true })
  submitDate: string;

  /*
   * Approval status
   *
   * PENDING
   * APPROVED
   * REJECTED
   */
  @Prop({
    required: true,
    enum: STATUS,
    default: STATUS.PENDING,
  })
  status: string;

  /*
   * Manager/Admin who approved
   */
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: Employee.name,
  })
  approveBy: string;

  /*
   * Approval date
   */
  @Prop()
  approveAt: string;
}

// Convert class into MongoDB schema
export const TimeSheetSchema = SchemaFactory.createForClass(TimeSheet);
