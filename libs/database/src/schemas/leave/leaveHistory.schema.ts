import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as mongoose from 'mongoose';
import { LeaveRequest } from './leaveRequest.schema';
import { User } from '../authentication/user.schema';
import { TRANSACTION_TYPE } from '../consts/consts.schema';


// Leave History Schema
export type LeaveHistoryDocument = LeaveHistory & Document;

@Schema({ timestamps: true, versionKey: false })
export class LeaveHistory {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: User.name,
    required: false,
    default: null,
  })
  userId: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: LeaveRequest.name,
    required: false,
    default: null,
  })
  leaveId: string;

  @Prop({ required: true })
  message: string;

  @Prop({ required: true })
  leaveAmount: number;

  @Prop({required:true, enum: TRANSACTION_TYPE })
  transactionType: string;
}

export const LeaveHistorySchema = SchemaFactory.createForClass(LeaveHistory);
