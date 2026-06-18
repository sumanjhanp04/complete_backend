import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// Leave Type Schema
export type LeaveTypeDocument = LeaveType & Document;

@Schema({ timestamps: true,versionKey:false })
export class LeaveType {

  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({default:1})
  leaveDeductionAmount: number;

  @Prop({default:true})
  leaveDeductionApplicable: boolean;
}

export const LeaveTypeSchema = SchemaFactory.createForClass(LeaveType);
