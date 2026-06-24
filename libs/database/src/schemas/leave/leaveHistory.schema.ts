// Import NestJS Mongoose decorators
import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';

// Import Mongoose Document type
import { Document } from 'mongoose';

// Import mongoose package
import * as mongoose from 'mongoose';

// Import Leave Request Schema
import { LeaveRequest } from './leaveRequest.schema';

// Import User Schema
import { User } from '../authentication/user.schema';

// Import Transaction Types Enum/Constants
import { TRANSACTION_TYPE } from '../consts/consts.schema';

// ========================================
// Document Type
//
// Adds Mongoose document methods
//
// Example:
// history.save()
// history._id
// ========================================
export type LeaveHistoryDocument = LeaveHistory & Document;

// ========================================
// Leave History Schema
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
export class LeaveHistory {
  // ========================================
  // Employee Reference
  //
  // Points to User Collection
  //
  // Example:
  // userId = ObjectId("abc123")
  // ========================================
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: User.name,
    required: false,
    default: null,
  })
  userId: string;

  // ========================================
  // Leave Request Reference
  //
  // Links history entry to a leave request
  //
  // Example:
  // leaveId = ObjectId("leave123")
  // ========================================
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: LeaveRequest.name,
    required: false,
    default: null,
  })
  leaveId: string;

  // ========================================
  // History Message
  //
  // Example:
  // "Leave Approved"
  // "Leave Deducted"
  // "Leave Encashed"
  // ========================================
  @Prop({
    required: true,
  })
  message: string;

  // ========================================
  // Leave Amount
  //
  // Example:
  // 2 Days
  // 5 Days
  // ========================================
  @Prop({
    required: true,
  })
  leaveAmount: number;

  // ========================================
  // Transaction Type
  //
  // Must be one of:
  // TRANSACTION_TYPE.CREDIT
  // TRANSACTION_TYPE.DEBIT
  //
  // Example:
  // CREDIT -> Leave Added
  // DEBIT -> Leave Deducted
  // ========================================
  @Prop({
    required: true,
    enum: TRANSACTION_TYPE,
  })
  transactionType: string;
}

// ========================================
// Create MongoDB Schema
// ========================================
export const LeaveHistorySchema = SchemaFactory.createForClass(LeaveHistory);
