import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { Breaks } from './breaks.schema';

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Attendance extends Document {
  @Prop({ required: true })
  employeeId: string;

  @Prop({ default: () => Date() })
  entryTime: Date;

  @Prop()
  exitTime: Date;

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: Breaks.name }] })
  breaks: mongoose.Schema.Types.ObjectId[];

  @Prop({ enum: ['WFO', 'WFH'], default: 'WFO' })
  attendanceType: string;
  // @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' })
  // reportsTo: string
}

export const attendanceSchema = SchemaFactory.createForClass(Attendance);
