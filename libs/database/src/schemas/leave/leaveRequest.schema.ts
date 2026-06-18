import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';

import { Document } from 'mongoose';
import * as mongoose from 'mongoose';
import { User } from '../authentication/user.schema';
import { LeaveType } from './leaveType.schema';
import { ACTIVITY_STATUS, LEAVE_DURATION, LEAVE_STATUS, STATUS } from '../consts/consts.schema';
import { Employee } from '../employees/employee.schema';

// Leave Request Schema
export type LeaveRequestDocument = LeaveRequest & Document;

@Schema({ timestamps: true, versionKey: false })
export class LeaveRequest {
  @Prop({ default: [] })
  documentPaths: string[];

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: User.name,
    required: true,
  })
  userId: string;

  @Prop({ required: false })
  uploadedFilename: string;

  @Prop({ required: false })
  uploadedFilePath: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: LeaveType.name,
    required: true,
  })
  leaveType: string;

  @Prop({ required: true })
  startDate: string;

  @Prop({ required: true })
  endDate: string;

  @Prop()
  reasonForLeave: string;

  @Prop({
    type: [
      {
        date: { type: Date, required: true },
        leaveDuration: {
          type: String,
          enum: LEAVE_DURATION,
          required: true,
        },
      },
    ],
    default: [],
  })
  leaveDuration: { date: Date; leaveDuration: string }[];

  @Prop({ default: 0 })
  deductedLeaveBalance: number;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: Employee.name,
    required: true,
  })
  currentReviewer: string;

  @Prop({ enum: LEAVE_STATUS })
  leaveStatus: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: User.name,
    required: true,
  })
  updatedBy: string;

  @Prop({
    type: [
      {
        order: { type: Number, required: true },
        reviewer: {
          type: mongoose.Schema.Types.ObjectId,
          ref: User.name,
          required: true,
        },
        status: {
          type: String,
          enum: STATUS,
          default: 'PENDING',
        },
        reasonForStatus: { type: String },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    default: [],
  })
  approversList: {
    order: number;
    reviewer: string;
    status: string;
    reasonForStatus?: string;
    timestamp?: Date;
  }[];

  @Prop({ required: true, default: 10 })
  applicableLeave: number;

  @Prop({ default: false })
  isSandwichPolicyApplicable: boolean;

  @Prop({ default: 0 })
  sandwichLeaveDeduction: number;
  @Prop({
    type: [
      {
        date: { type: Date, default: Date.now },
        status: {
          type: String,
          enum: ACTIVITY_STATUS,
          default: 'PENDING',
        },
        description: { type: String },
        
      },
    ],
    default: [],
  })
  activities: {
    date: string;
    status: string;
    description: string;
  }[];
}

export const LeaveRequestSchema = SchemaFactory.createForClass(LeaveRequest);
