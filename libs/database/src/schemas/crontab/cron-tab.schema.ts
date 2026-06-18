import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
  timestamps: true,
  versionKey: false,
})
export class CronTab extends Document {
  @Prop({ type: String, required: true })
  cronId: string;

  @Prop({ type: String, required: true })
  cronExpression: string;

  @Prop({ type: String, required: true })
  type: string;

  @Prop({ type: String, default:null })
  occurrence: string;

  @Prop({ type: String, default:null })
  runCount: string;

  @Prop({ type: String, default:null })
  expireDate: string;

  @Prop({ type: Boolean, required: true, default: true })
  status: boolean;
}

export const CronTabSchema = SchemaFactory.createForClass(CronTab);
