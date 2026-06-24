// Import NestJS Mongoose decorators
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

// Import Mongoose and Document type
import mongoose, { Document } from 'mongoose';

// ========================================
// Designation Schema
//
// versionKey: false
// -> removes __v field
//
// timestamps: true
// -> automatically adds:
//    createdAt
//    updatedAt
// ========================================
@Schema({
  versionKey: false,
  timestamps: true,
})
export class Designation extends Document {
  // ========================================
  // Designation Name
  //
  // Examples:
  // Software Engineer
  // HR Manager
  // Team Lead
  // Project Manager
  //
  // unique:true
  // means duplicate designation names
  // are not allowed
  // ========================================
  @Prop({
    required: true,
    unique: true,
  })
  designationName: string;

  // ========================================
  // Department Reference
  //
  // Links designation to department
  //
  // Example:
  // Software Engineer
  //        ↓
  // Development Department
  //
  // Stored as MongoDB ObjectId
  // ========================================
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
  })
  department: mongoose.Schema.Types.ObjectId;
}

// ========================================
// Create MongoDB Schema
// ========================================
export const designationSchema = SchemaFactory.createForClass(Designation);
