import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as mongoose from 'mongoose';
import { Shift } from '../employees/shift.schema';
import { Department } from '../masterSchemas/department.schema';
import { Employee } from '../employees/employee.schema';

export type NoticeDocument = Notice & Document;

@Schema({ timestamps: true })
export class Notice {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  filename: string;

  @Prop()
  description?: string;

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

  // Expiry date for the file
  @Prop({ required: false })
  expiryDate?: string;

  @Prop({ required: true })
  filePath: string;

  @Prop()
  emergencyPhNos?: string[];
  @Prop()
  alternativeEmailIds?: string[];
}

export const NoticeSchema = SchemaFactory.createForClass(Notice);
