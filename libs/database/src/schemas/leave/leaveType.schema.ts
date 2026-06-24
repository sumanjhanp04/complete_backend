// Import NestJS Mongoose decorators
import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';

// Import Mongoose Document Type
import { Document } from 'mongoose';

// ========================================
// Mongoose Document Type
//
// Gives access to:
// save()
// _id
// updateOne()
// etc.
// ========================================
export type LeaveTypeDocument = LeaveType & Document;

// ========================================
// Leave Type Schema
//
// timestamps:true
// -> createdAt
// -> updatedAt
//
// versionKey:false
// -> removes __v field
// ========================================
@Schema({
  timestamps: true,
  versionKey: false,
})
export class LeaveType {
  // ========================================
  // Leave Name
  //
  // Examples:
  // Sick Leave
  // Casual Leave
  // Earned Leave
  // ========================================
  @Prop({
    required: true,
  })
  name: string;

  // ========================================
  // Description
  //
  // Example:
  // "Used when employee is sick"
  // ========================================
  @Prop()
  description: string;

  // ========================================
  // Leave Deduction Amount
  //
  // How many leave credits should
  // be deducted when this leave is used.
  //
  // Default = 1
  //
  // Example:
  // Sick Leave = 1
  // Half Day = 0.5
  // ========================================
  @Prop({
    default: 1,
  })
  leaveDeductionAmount: number;

  // ========================================
  // Should leave balance be deducted?
  //
  // true  -> deduct leave balance
  // false -> do not deduct balance
  //
  // Example:
  // Paid Leave      = true
  // Work From Home  = false
  // ========================================
  @Prop({
    default: true,
  })
  leaveDeductionApplicable: boolean;
}

// ========================================
// Create MongoDB Schema
// ========================================
export const LeaveTypeSchema = SchemaFactory.createForClass(LeaveType);
