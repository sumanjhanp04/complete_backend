// Import NestJS Mongoose decorators
import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';

// Mongoose Document type
import { Document } from 'mongoose';

// Import mongoose package
import * as mongoose from 'mongoose';

// Import User Schema
import { User } from '../authentication/user.schema';

// ========================================
// Type Definition
//
// This creates a document type:
//
// EmployeeLeaveBalance + MongoDB Document methods
//
// Example:
// leave.save()
// leave._id
// ========================================
export type EmployeeLeaveDocument = EmployeeLeaveBalance & Document;

// ========================================
// Employee Leave Schema
//
// timestamps: true
// -> createdAt
// -> updatedAt
//
// versionKey: false
// -> removes __v field
// ========================================
@Schema({
  timestamps: true,
  versionKey: false,
})
export class EmployeeLeaveBalance {
  // ========================================
  // Reference to User Collection
  //
  // MongoDB ObjectId
  //
  // Example:
  // userId: ObjectId("123456")
  //
  // Refers to:
  // User Collection
  // ========================================
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: User.name,
    required: true,
  })
  userId: string;

  // ========================================
  // Leave Year
  //
  // Example:
  // 2025
  // 2026
  // ========================================
  @Prop({ required: true })
  year: number;

  // ========================================
  // Total Paid Leave Allocated
  //
  // Example:
  // 24 days
  // ========================================
  @Prop()
  totalPaidLeave: number;

  // ========================================
  // Total Unpaid Leave Taken
  //
  // Default = 0
  // ========================================
  @Prop({
    default: 0,
  })
  unpaidLeave: number;

  // ========================================
  // Remaining Paid Leave
  //
  // Example:
  // Total = 24
  // Used = 10
  //
  // Remaining = 14
  // ========================================
  @Prop()
  remainingPaidLeave: number;

  // ========================================
  // Leave Encashments
  //
  // Example:
  // Employee converts leave into money
  // ========================================
  @Prop()
  leaveEncashments: number;

  // ========================================
  // Carry Forward Leave
  //
  // Example:
  // Previous Year Remaining Leave
  // ========================================
  @Prop()
  carryForwardedFromPreviousYear: number;

  // ========================================
  // Leave Carried To Next Year
  //
  // Example:
  // 5 leaves remaining
  // Transfer to next year
  // ========================================
  @Prop()
  carryForwardToNextYear: number;

  // ========================================
  // Money received from leave encashment
  //
  // Example:
  // ₹5000
  // ========================================
  @Prop()
  leaveEncashmentValue: number;
}

// ========================================
// Generate Mongoose Schema
//
// Converts class into MongoDB Schema
// ========================================
export const EmployeeLeaveSchema =
  SchemaFactory.createForClass(EmployeeLeaveBalance);
