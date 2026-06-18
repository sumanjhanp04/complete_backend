import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { Company } from './company.schema';
import { User } from '../authentication/user.schema';

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Client extends Document {
  @Prop({ required: true })
  firstName: string;

  @Prop()
  lastName: string;

  @Prop({ required: true })
  email: string;

  @Prop()
  secondaryEmail: string;

  @Prop({ required: true })
  mobile: string;

  @Prop()
  secondaryMobile: string;

  @Prop()
  address: string;

  @Prop()
  gender: string;

  @Prop()
  dob: string;

  @Prop()
  country: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: Company.name,
  })
  company: mongoose.Schema.Types.ObjectId;

  image: string;


  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: User.name,
    default: null,
    required: false
  })
  createdBy: string | null


  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: User.name,
    default: null,
    required: false
  })
  updatedBy: string | null
}

export const clientSchema = SchemaFactory.createForClass(Client);
