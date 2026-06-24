// NestJS Mongoose decorators
import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';

// Mongoose Document Type
import { Document } from 'mongoose';

import * as mongoose from 'mongoose';

// User Schema
import { User } from '../authentication/user.schema';

// Leave Type Schema
import { LeaveType } from './leaveType.schema';

// Constants / Enums
import {
  ACTIVITY_STATUS,
  LEAVE_DURATION,
  LEAVE_STATUS,
  STATUS,
} from '../consts/consts.schema';

// Employee Schema
import { Employee } from '../employees/employee.schema';

// ========================================
// Mongoose Document Type
// ========================================
export type LeaveRequestDocument = LeaveRequest & Document;

// ========================================
// Leave Request Schema
//
// MongoDB Collection:
// leave_requests
//
// timestamps:
// createdAt
// updatedAt
// ========================================
@Schema({
  timestamps: true,
  versionKey: false,
})
export class LeaveRequest {
  // ========================================
  // Uploaded Documents
  //
  // Example:
  // Medical Certificates
  // Supporting Documents
  // ========================================
  @Prop({ default: [] })
  documentPaths: string[];

  // ========================================
  // Employee/User Applying Leave
  // ========================================
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: User.name,
    required: true,
  })
  userId: string;

  // ========================================
  // Uploaded File Name
  //
  // Example:
  // medical_certificate.pdf
  // ========================================
  @Prop({ required: false })
  uploadedFilename: string;

  // ========================================
  // Uploaded File Path
  //
  // Example:
  // AWS S3 URL
  // Local Path
  // ========================================
  @Prop({ required: false })
  uploadedFilePath: string;

  // ========================================
  // Leave Type Reference
  //
  // Example:
  // Casual Leave
  // Sick Leave
  // Earned Leave
  // ========================================
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: LeaveType.name,
    required: true,
  })
  leaveType: string;

  // ========================================
  // Leave Start Date
  // ========================================
  @Prop({ required: true })
  startDate: string;

  // ========================================
  // Leave End Date
  // ========================================
  @Prop({ required: true })
  endDate: string;

  // ========================================
  // Leave Reason
  //
  // Example:
  // Family Function
  // Medical Emergency
  // ========================================
  @Prop()
  reasonForLeave: string;

  // ========================================
  // Daily Leave Duration
  //
  // Example:
  // Full Day
  // Half Day
  // ========================================
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
  leaveDuration: {
    date: Date;
    leaveDuration: string;
  }[];

  // ========================================
  // Total Leave Deducted
  //
  // Example:
  // 2 Days
  // ========================================
  @Prop({ default: 0 })
  deductedLeaveBalance: number;

  // ========================================
  // Current Reviewer
  //
  // Current Approver
  // ========================================
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: Employee.name,
    required: true,
  })
  currentReviewer: string;

  // ========================================
  // Leave Status
  //
  // PENDING
  // APPROVED
  // REJECTED
  // ========================================
  @Prop({
    enum: LEAVE_STATUS,
  })
  leaveStatus: string;

  // ========================================
  // Last User Who Updated
  // ========================================
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: User.name,
    required: true,
  })
  updatedBy: string;

  // ========================================
  // Approval Workflow
  //
  // Multiple Approvers
  // ========================================
  @Prop({
    type: [
      {
        order: {
          type: Number,
          required: true,
        },

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

        reasonForStatus: {
          type: String,
        },

        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    default: [],
  })
  approversList: {
    // Approval Order
    order: number;

    // Reviewer UserId
    reviewer: string;

    // PENDING / APPROVED / REJECTED
    status: string;

    // Rejection Reason
    reasonForStatus?: string;

    // Action Time
    timestamp?: Date;
  }[];

  // ========================================
  // Total Applicable Leave
  //
  // Default = 10
  // ========================================
  @Prop({
    required: true,
    default: 10,
  })
  applicableLeave: number;

  // ========================================
  // Sandwich Policy
  //
  // Example:
  //
  // Friday Leave
  // Saturday Holiday
  // Sunday Holiday
  // Monday Leave
  //
  // Count = 4 Days
  // ========================================
  @Prop({
    default: false,
  })
  isSandwichPolicyApplicable: boolean;

  // ========================================
  // Extra Leave Deducted
  // Due To Sandwich Policy
  // ========================================
  @Prop({
    default: 0,
  })
  sandwichLeaveDeduction: number;

  // ========================================
  // Activity Logs
  //
  // Every action gets recorded
  // ========================================
  @Prop({
    type: [
      {
        date: {
          type: Date,
          default: Date.now,
        },

        status: {
          type: String,
          enum: ACTIVITY_STATUS,
          default: 'PENDING',
        },

        description: {
          type: String,
        },
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

// ========================================
// Create MongoDB Schema
// ========================================
export const LeaveRequestSchema = SchemaFactory.createForClass(LeaveRequest);
