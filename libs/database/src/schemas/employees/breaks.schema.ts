import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
  versionKey: false,
  timestamps: true,
})
export class Breaks extends Document {
  @Prop({ required: true })
  name: string;

  @Prop()
  endTime: Date;
}

export const breakSchema = SchemaFactory.createForClass(Breaks);
