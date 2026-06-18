import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
  versionKey: false,
  timestamps: true,
})
export class Department extends Document {
  @Prop({ required: true })
  departmentName: string;
}

export const departmentSchema = SchemaFactory.createForClass(Department);
