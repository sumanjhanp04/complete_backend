import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Company extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  address: string;

  @Prop()
  website: string;

  @Prop()
  email: string;

  @Prop()
  mobile: string;
}

export const companySchema = SchemaFactory.createForClass(Company);
