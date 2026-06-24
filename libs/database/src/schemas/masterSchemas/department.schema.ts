// Import Mongoose decorators from NestJS
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

// Import Document type from mongoose
import { Document } from 'mongoose';

// ========================================
// Department Schema
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

// Department Collection Schema
export class Department extends Document {
  // ========================================
  // Department Name
  //
  // Examples:
  // HR
  // Development
  // Marketing
  // Sales
  //
  // required: true
  // means MongoDB won't allow empty values
  // ========================================
  @Prop({
    required: true,
  })
  departmentName: string;
}

// ========================================
// Create MongoDB Schema
//
// Converts Department class into
// Mongoose Schema
// ========================================
export const departmentSchema = SchemaFactory.createForClass(Department);
