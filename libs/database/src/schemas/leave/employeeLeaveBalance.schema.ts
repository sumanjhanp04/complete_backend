import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as mongoose from 'mongoose';
import { User } from '../authentication/user.schema';
export type EmployeeLeaveDocument = EmployeeLeaveBalance & Document;

// Employee Leave Schema
@Schema({ timestamps: true, versionKey: false })
export class EmployeeLeaveBalance {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: User.name,
    required: true,
  })
  userId: string;

  @Prop({ required: true })
  year: number;

  @Prop()
  totalPaidLeave: number;
  @Prop({default:0})
  unpaidLeave: number;

  @Prop()
  remainingPaidLeave: number;

  @Prop()
  leaveEncashments: number;

  @Prop()
  carryForwardedFromPreviousYear: number;

  @Prop()
  carryForwardToNextYear: number;

  @Prop()
  leaveEncashmentValue: number;
}

export const EmployeeLeaveSchema = SchemaFactory.createForClass(EmployeeLeaveBalance);
