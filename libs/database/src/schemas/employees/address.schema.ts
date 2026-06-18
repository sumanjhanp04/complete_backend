import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Address extends Document {
  @Prop({ required: true })
  address: string;

  @Prop()
  landmark?: string;

  @Prop({ required: true })
  city: string;

  @Prop({ required: true })
  state: string;

  @Prop({ required: true })
  pinCode: string;

  @Prop({ required: true })
  country: string;
}

export const AddressSchema = SchemaFactory.createForClass(Address);
