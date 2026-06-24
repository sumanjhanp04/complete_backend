// NestJS Mongoose decorators
import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';

// Mongoose Document
import { Document } from 'mongoose';

import * as mongoose from 'mongoose';

// Shift Schema
import { Shift } from '../employees/shift.schema';

// Department Schema
import { Department } from '../masterSchemas/department.schema';

// Employee Schema
import { Employee } from '../employees/employee.schema';

// ========================================
// MongoDB Document Type
// ========================================
export type NoticeDocument = Notice & Document;

// ========================================
// Notice Schema
//
// timestamps:true
// Automatically creates:
//
// createdAt
// updatedAt
// ========================================
@Schema({ timestamps: true })
export class Notice {
  // ========================================
  // Notice Title
  //
  // Example:
  // "Office Closed on Diwali"
  // ========================================
  @Prop({ required: true })
  title: string;

  // ========================================
  // Uploaded File Name
  //
  // Example:
  // holiday-list.pdf
  // ========================================
  @Prop({ required: true })
  filename: string;

  // ========================================
  // Notice Description
  //
  // Example:
  // Office will remain closed...
  // ========================================
  @Prop()
  description?: string;

  // ========================================
  // Shift Targeting
  //
  // Which shifts should see this notice?
  //
  // Example:
  // Morning Shift
  // Night Shift
  // ========================================
  @Prop({
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: Shift.name,
      },
    ],
    default: null,
  })
  shift?: string[];

  // ========================================
  // Department Targeting
  //
  // Example:
  // Development
  // HR
  // Sales
  // ========================================
  @Prop({
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: Department.name,
      },
    ],
    default: null,
  })
  department?: string[];

  // ========================================
  // Specific Employee Targeting
  //
  // Example:
  // Only selected employees
  // ========================================
  @Prop({
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: Employee.name,
      },
    ],
    default: null,
  })
  employeeId?: string[];

  // ========================================
  // Notice Expiry Date
  //
  // Example:
  // 2026-12-31
  //
  // After expiry date
  // notice can be hidden automatically
  // ========================================
  @Prop({ required: false })
  expiryDate?: string;

  // ========================================
  // File Location
  //
  // Example:
  // AWS S3 URL
  // Local File Path
  // ========================================
  @Prop({ required: true })
  filePath: string;

  // ========================================
  // Emergency Contact Numbers
  //
  // Example:
  // HR Helpline
  // Emergency Contact
  // ========================================
  @Prop()
  emergencyPhNos?: string[];

  // ========================================
  // Alternative Email IDs
  //
  // Example:
  // support@company.com
  // hr@company.com
  // ========================================
  @Prop()
  alternativeEmailIds?: string[];
}

// ========================================
// Create MongoDB Schema
// ========================================
export const NoticeSchema = SchemaFactory.createForClass(Notice);
