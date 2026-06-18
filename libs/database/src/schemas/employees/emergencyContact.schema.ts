import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as mongoose from 'mongoose';
import { Address } from './address.schema';

@Schema({ timestamps: true })
export class EmergencyContact extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  relation: string;

  @Prop({ required: true })
  primaryMobile: string;

  @Prop()
  secondaryMobile?: string[];

  @Prop({ required: true })
  primaryEmail: string;

  @Prop()
  secondaryEmail?: string[];

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: Address.name,
    
  })
  permanentAddress?: mongoose.Schema.Types.ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: Address.name,
  })
  currentAddress?: mongoose.Schema.Types.ObjectId;

  @Prop({ type: Boolean, default: false })
  sameAsPermanentAddress: boolean;
}

export const EmergencyContactSchema =
  SchemaFactory.createForClass(EmergencyContact);
