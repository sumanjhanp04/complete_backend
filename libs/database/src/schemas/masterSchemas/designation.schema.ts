import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

@Schema({ versionKey: false, timestamps: true })
export class Designation extends Document {
  @Prop({ required: true, unique: true })
  designationName: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Department' })
  department: mongoose.Schema.Types.ObjectId;
}

export const designationSchema = SchemaFactory.createForClass(Designation);
