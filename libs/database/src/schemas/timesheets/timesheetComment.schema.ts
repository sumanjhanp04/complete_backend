import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, now } from 'mongoose';
import { Employee } from '../employees/employee.schema';

export type TimeSheetCommentType = TimeSheetComment & Document;

@Schema({ timestamps: true })
export class TimeSheetComment {
  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: TimeSheetComment.name,
  })
  timeSheet: string;

  @Prop({
    required: true,
    type: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: Employee.name },
        date: {
          type: Date,
          default: new Date(),
        },
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

export const TimeSheetCommentSchema =
  SchemaFactory.createForClass(TimeSheetComment);
